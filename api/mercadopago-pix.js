/* global process */
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabaseAdmin } from './_supabaseAdmin.js';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planType, userId } = req.body;

    if (!planType || !userId) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // Buscar usuário no Supabase
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      console.error(userError);
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const amount = planType === 'monthly'
        ? Number(process.env.PIX_MONTHLY_AMOUNT ?? 29.90)
        : Number(process.env.PIX_YEARLY_AMOUNT ?? 299.00);

    if (!amount || amount <= 0) {
      return res.status(500).json({ error: 'Valor PIX não configurado.' });
    }

    const description = planType === 'monthly'
        ? 'Plano mensal Conversando com Deus (PIX)'
        : 'Plano anual Conversando com Deus (PIX)';

    // Concatenar a URL base de forma dinâmica para o webhook
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const notificationUrl = `${protocol}://${host}/api/mercadopago-webhook?secret=${process.env.MP_WEBHOOK_SECRET}`;

    const payment = new Payment(client);

    const body = {
      transaction_amount: amount,
      description,
      payment_method_id: 'pix',
      notification_url: notificationUrl,
      payer: {
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Cliente',
      },
      metadata: {
        userId: user.id,
        planType,
      },
    };

    const result = await payment.create({ body });

    // Dados do QR Code PIX conforme o retorno do SDK v2
    const qrBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCodeText = result.point_of_interaction?.transaction_data?.qr_code; // copia e cola

    return res.status(200).json({
      paymentId: result.id,
      qr_base64: qrBase64,
      qr_code: qrCodeText,
    });
  } catch (err) {
    console.error('Erro ao criar pagamento PIX Mercado Pago:', err);
    return res.status(500).json({ 
      error: 'Erro interno ao criar PIX.',
      message: err.message 
    });
  }
}
