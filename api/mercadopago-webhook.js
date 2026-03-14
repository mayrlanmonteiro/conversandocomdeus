/* global process */
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabaseAdmin } from './_supabaseAdmin.js';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // O Mercado Pago envia o ID da notificação via query params
  // Adicionamos um secret para segurança extra contra chamadas falsas
  try {
    const secret = req.query.secret;
    if (!secret || secret !== process.env.MP_WEBHOOK_SECRET) {
      console.warn('Webhook MP: Chamada não autorizada (secret inválido ou ausente)');
      return res.status(401).send('Unauthorized');
    }

    const topic = (req.query.topic || req.query.type);
    const paymentId = (req.query['data.id'] || req.query.id);

    if (topic === 'payment' && paymentId) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata?.user_id || paymentData.metadata?.userId;
        const planType = paymentData.metadata?.plan_type || paymentData.metadata?.planType;

        if (userId && planType) {
          const now = new Date();
          const activeUntil = new Date(now);

          if (planType === 'monthly') {
            activeUntil.setMonth(activeUntil.getMonth() + 1);
          } else {
            activeUntil.setFullYear(activeUntil.getFullYear() + 1);
          }

          // Atualizar perfil do usuário
          await supabaseAdmin
            .from('profiles')
            .update({
              plan: planType,
              billing_method: 'pix_mercadopago',
              subscription_status: 'active',
              active_until: activeUntil.toISOString(),
            })
            .eq('id', userId);

          // Atualizar metadados do usuário para acesso imediato via JWT
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { 
                is_premium: true,
                billing_method: 'pix_mercadopago',
                plan: planType
            }
          });

          console.log(`Pagamento Mercado Pago aprovado e processado: Usuário ${userId}, Plano ${planType}`);
        }
      }
    }

    // Sempre responder 200 (OK) para o Mercado Pago
    res.status(200).send('ok');
  } catch (err) {
    console.error('Erro no processamento do webhook Mercado Pago:', err);
    // Respondemos 500 para o MP tentar novamente depois se for erro real
    res.status(500).send('Internal Server Error');
  }
}
