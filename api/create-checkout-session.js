/* global process */
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planType, userId } = req.body;

    if (!planType || !userId) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // Buscar usuário e e-mail no Supabase (garante que userId é válido)
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
        ? (process.env.STRIPE_PRICE_MONTHLY || process.env.VITE_STRIPE_PRICE_MONTHLY)
        : (process.env.STRIPE_PRICE_YEARLY || process.env.VITE_STRIPE_PRICE_YEARLY);

    if (!priceId) {
      return res.status(500).json({ error: 'Configuração de preços (Price IDs) não encontrada no ambiente.' });
    }

    // Verificar se já temos stripe_customer_id no perfil
    // Nota: Tentamos buscar, se falhar (tabela não existe), trataremos no catch
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar profile:', profileError);
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUserId: user.id,
        },
      });
      customerId = customer.id;

      // Tenta atualizar/inserir no profile. 
      // Upsert garante que se o profile não existir, ele cria.
      await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: user.id, 
          stripe_customer_id: customerId,
          email: user.email 
        });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planType,
      },
      success_url: `${req.headers.origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin}/profile?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erro ao criar sessão de checkout Stripe:', err);
    return res.status(500).json({ error: 'Erro interno ao criar sessão de pagamento.' });
  }
}
