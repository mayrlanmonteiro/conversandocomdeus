/* global process */
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabaseAdmin } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  // Responde 200 imediatamente (padrão recomendado pelo MP para não reenviar webhook)
  res.status(200).send('ok');

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('[MP Webhook] MP_ACCESS_TOKEN não configurado.');
    return;
  }

  const secret = req.query.secret;
  if (!secret || secret !== process.env.MP_WEBHOOK_SECRET) {
    console.warn('[MP Webhook] Chamada não autorizada.');
    return;
  }

  const topic     = req.query.topic || req.query.type;
  const paymentId = req.query['data.id'] || req.query.id;

  if (topic !== 'payment' || !paymentId) return;

  try {
    const client  = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status !== 'approved') return;

    const userId   = paymentData.metadata?.user_id || paymentData.metadata?.userId;
    const planType = paymentData.metadata?.plan_type || paymentData.metadata?.planType;

    if (!userId || !planType) {
      console.warn('[MP Webhook] userId ou planType ausente nos metadados.');
      return;
    }

    const now        = new Date();
    const activeUntil = new Date(now);
    if (planType === 'monthly') {
      activeUntil.setMonth(activeUntil.getMonth() + 1);
    } else {
      activeUntil.setFullYear(activeUntil.getFullYear() + 1);
    }

    // Atualiza perfil e metadados em paralelo
    await Promise.all([
      supabaseAdmin.from('profiles').update({
        plan: planType,
        billing_method: 'pix_mercadopago',
        subscription_status: 'active',
        active_until: activeUntil.toISOString(),
      }).eq('id', userId),

      supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { is_premium: true, billing_method: 'pix_mercadopago', plan: planType },
      }),
    ]);

    console.log(`[MP Webhook] Aprovado: usuário=${userId} plano=${planType} até=${activeUntil.toISOString()}`);

  } catch (err) {
    console.error('[MP Webhook] Erro ao processar:', err.message);
  }
}
