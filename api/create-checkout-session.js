/* global process */
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Price IDs pré-carregados (sem recalcular a cada request)
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || process.env.VITE_STRIPE_PRICE_MONTHLY,
  yearly:  process.env.STRIPE_PRICE_YEARLY  || process.env.VITE_STRIPE_PRICE_YEARLY,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { planType, userId } = req.body ?? {};
  if (!planType || !userId) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  const priceId = PRICE_IDS[planType];
  if (!priceId) {
    return res.status(500).json({ error: `Price ID para "${planType}" não configurado.` });
  }

  try {
    // ── Busca usuário e perfil em PARALELO (economiza ~200-400ms) ─────────────
    const [
      { data: { user }, error: userError },
      { data: profile }
    ] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', userId).single(),
    ]);

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    let customerId = profile?.stripe_customer_id;

    // Cria customer no Stripe apenas se não existir
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: { supabaseUserId: user.id },
      });
      customerId = customer.id;

      // Salva o customer ID sem bloquear a criação da sessão
      supabaseAdmin
        .from('profiles')
        .upsert({ id: user.id, stripe_customer_id: customerId, email: user.email })
        .then(({ error }) => { if (error) console.error('[Stripe] Erro ao salvar customer_id:', error); });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.id, planType },
      success_url: `${req.headers.origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url:  `${req.headers.origin}/planos?canceled=true`,
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('[Stripe Checkout] Erro:', err.message);
    return res.status(500).json({ error: 'Erro ao criar sessão de checkout.' });
  }
}
