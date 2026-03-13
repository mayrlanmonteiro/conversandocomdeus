/* global process */
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase Admin não configurado.' });
  }

  try {
    const { planType, userId } = req.body;

    if (!planType || !userId) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // Buscar usuário no Supabase pra garantir que existe
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error(userError);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const priceId =
      planType === 'monthly'
        ? process.env.STRIPE_PRICE_MONTHLY_PIX
        : process.env.STRIPE_PRICE_YEARLY_PIX;

    if (!priceId) {
      return res.status(500).json({ error: 'PriceId PIX não configurado nas variáveis de ambiente.' });
    }

    // Opcional: criar/usar stripe_customer_id já salvo no profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: { supabaseUserId: user.id },
      });
      customerId = customer.id;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Erro ao vincular customer id:', updateError);
        // Não travamos o fluxo aqui, mas logamos
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        planType,
        billingMethod: 'pix',
      },
      success_url: `${req.headers.origin}/planos?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/planos?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erro detalhado PIX:', err);
    return res.status(500).json({ 
      error: 'Erro ao criar cobrança PIX.',
      message: err.message,
      details: err.raw?.message || err.toString()
    });
  }
}
