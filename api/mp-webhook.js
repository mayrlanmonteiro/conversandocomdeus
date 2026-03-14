/* global process */
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabaseAdmin } from './_supabaseAdmin.js';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // O Mercado Pago envia o ID da notificação via query params
  const { type, 'data.id': dataId } = req.query;

  // Se type for 'payment', buscamos os detalhes do pagamento
  if (type === 'payment' && dataId) {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: dataId });

      if (paymentData.status === 'approved') {
        const userId = paymentData.metadata.user_id;
        const planType = paymentData.metadata.plan_type;

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
              billing_method: 'pix_mp',
              subscription_status: 'active',
              active_until: activeUntil.toISOString(),
            })
            .eq('id', userId);

          // Atualizar metadados do usuário para acesso imediato
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { 
                is_premium: true,
                billing_method: 'pix_mp',
                plan: planType
            }
          });

          console.log(`Pagamento Mercado Pago aprovado para o usuário ${userId}`);
        }
      }
    } catch (err) {
      console.error('Erro ao processar webhook Mercado Pago:', err);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Respondemos 200 sempre para o Mercado Pago parar de enviar a notificação
  res.status(200).send('ok');
}
