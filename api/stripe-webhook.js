/* global process, Buffer */
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from './_supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        // Ativa o premium no banco de dados (Auth Metadata ou Tabela Profiles)
        // Aqui estamos atualizando os metadados do usuário via Supabase Admin (Service Role)
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { 
                is_premium: true,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId
            }
        });
        
        console.log(`Usuário ${userId} agora é Premium.`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Precisamos encontrar o usuário pelo customerId
        // Alternativamente, a subscription pode ter metadados se passados na criação
        // Vamos buscar o usuário que tem esse subscription_id
        
        const { data: users } = await supabase.auth.admin.listUsers();
        const targetUser = users?.users.find(u => u.user_metadata?.stripe_subscription_id === subscription.id);

        if (targetUser) {
            await supabase.auth.admin.updateUserById(targetUser.id, {
                user_metadata: { is_premium: false }
            });
            console.log(`Assinatura de ${targetUser.id} cancelada.`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('Erro ao processar evento do webhook:', err);
    res.status(500).send('Webhook handler failed');
  }
}

// Helper para ler o raw body (necessário para o Stripe validar a assinatura)
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
