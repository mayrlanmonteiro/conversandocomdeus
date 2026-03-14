/* global process, Buffer */
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export const config = { api: { bodyParser: false } };

// Helper para ler o raw body
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Helper: calcula active_until para pagamento único
function calcActiveUntil(planType) {
  const d = new Date();
  planType === 'monthly' ? d.setMonth(d.getMonth() + 1) : d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('Missing Stripe signature');

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Assinatura inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Responde imediatamente para evitar timeout do Stripe
  res.status(200).send('ok');

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session        = event.data.object;
        const { userId, planType, billingMethod } = session.metadata ?? {};
        const subscriptionId = session.subscription;
        const customerId     = session.customer;

        if (!userId) break;

        if (billingMethod === 'pix' && session.payment_status === 'paid') {
          // Pagamento PIX único via Stripe
          await Promise.all([
            supabaseAdmin.from('profiles').update({
              plan: planType,
              billing_method: 'pix',
              subscription_status: 'active',
              active_until: calcActiveUntil(planType),
              stripe_customer_id: customerId,
            }).eq('id', userId),

            supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: { is_premium: true, billing_method: 'pix', plan: planType },
            }),
          ]);
          console.log(`[Stripe] PIX aprovado: userId=${userId}`);
          break;
        }

        if (session.mode === 'subscription' && subscriptionId) {
          // Assinatura com cartão
          await Promise.all([
            supabaseAdmin.from('profiles').update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan: planType || null,
              subscription_status: 'active',
              billing_method: 'card',
              active_until: null,
            }).eq('id', userId),

            supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: { is_premium: true, billing_method: 'card', plan: planType },
            }),
          ]);
          console.log(`[Stripe] Assinatura (cartão) ativada: userId=${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription   = event.data.object;
        const status         = subscription.status;

        const { data: updated } = await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: status })
          .eq('stripe_subscription_id', subscription.id)
          .select('id');

        if (updated?.length) {
          const uid = updated[0].id;
          await supabaseAdmin.auth.admin.updateUserById(uid, {
            user_metadata: { is_premium: status === 'active' },
          });
          console.log(`[Stripe] Assinatura userId=${uid} → status=${status}`);
        }
        break;
      }

      default:
        // Silencioso em produção
        break;
    }
  } catch (err) {
    console.error('[Stripe Webhook] Erro ao processar evento:', err.message);
  }
}
