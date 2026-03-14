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

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase Admin não configurado.' });
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
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const amount = planType === 'monthly' 
      ? parseFloat(process.env.PIX_MONTHLY_AMOUNT || '29.90')
      : parseFloat(process.env.PIX_YEARLY_AMOUNT || '299.00');

    const payment = new Payment(client);

    const body = {
      transaction_amount: amount,
      description: `Assinatura Conversando com Deus - Plano ${planType === 'monthly' ? 'Mensal' : 'Anual'}`,
      payment_method_id: 'pix',
      notification_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/mp-webhook`,
      payer: {
        email: user.email,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Cliente',
        last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Conversando com Deus',
      },
      metadata: {
        user_id: userId,
        plan_type: planType,
      },
    };

    const result = await payment.create({ body });

    // Retornamos os dados para o front gerar o QR Code ou exibir o código Copia e Cola
    return res.status(200).json({
      id: result.id,
      url: result.point_of_interaction.transaction_data.ticket_url,
      qr_code: result.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
      ticket_url: result.point_of_interaction.transaction_data.ticket_url,
    });

  } catch (err) {
    console.error('Erro ao criar PIX Mercado Pago:', err);
    return res.status(500).json({ 
      error: 'Erro ao gerar PIX.',
      message: err.message 
    });
  }
}
