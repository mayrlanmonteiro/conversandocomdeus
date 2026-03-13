/* global process, Buffer */
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('Missing Stripe signature');

  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig.toString(),
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erro no webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!userId || !subscriptionId || !customerId) break;

        // Atualizar tabela profiles
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: planType || null,
            subscription_status: 'active',
          })
          .eq('id', userId);

        // Opcional: Manter cópia nos metadados para facilitar leitura no front se necessário
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { is_premium: true }
        });
        
        console.log(`Assinatura completada para o usuário ${userId}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status; // 'active', 'canceled', 'past_due', etc.

        // Atualizar status onde stripe_subscription_id = subscription.id
        const { data: updated } = await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: status })
          .eq('stripe_subscription_id', subscriptionId)
          .select();

        if (updated && updated.length > 0) {
            const userId = updated[0].id;
            const isPremium = status === 'active';
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { is_premium: isPremium }
            });
            console.log(`Status da assinatura do usuário ${userId} atualizado para: ${status}`);
        }
        break;
      }

      default:
        console.log(`Event type não tratado: ${event.type}`);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('Erro ao processar evento do webhook:', err);
    res.status(500).send('Webhook handler failed');
  }
}

// Helper para ler o raw body
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
