/* global process */
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { supabaseAdmin } from './_supabaseAdmin.js';

// ─── Constantes pré-calculadas (evita recalcular a cada request) ────────────
const MONTHLY_AMOUNT = parseFloat(process.env.PIX_MONTHLY_AMOUNT) || 19.90;
const YEARLY_AMOUNT  = parseFloat(process.env.PIX_YEARLY_AMOUNT)  || 199.00;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({
      error: 'Configuração Incompleta',
      message: 'MP_ACCESS_TOKEN não configurado.',
    });
  }

  const { planType, userId } = req.body ?? {};
  if (!planType || !userId) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  try {
    // ── Busca usuário e monta payload em paralelo ────────────────────────────
    const [{ data: { user }, error: userError }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
    ]);

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const amount = planType === 'monthly' ? MONTHLY_AMOUNT : YEARLY_AMOUNT;
    const description = planType === 'monthly'
      ? 'Plano mensal – Conversando com Deus'
      : 'Plano anual – Conversando com Deus';

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host     = req.headers.host;
    const notificationUrl = `${protocol}://${host}/api/mercadopago-webhook?secret=${process.env.MP_WEBHOOK_SECRET}`;

    const client  = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        notification_url: notificationUrl,
        payer: {
          email: user.email,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Cliente',
        },
        metadata: { userId: user.id, planType },
      },
    });

    const td = result.point_of_interaction?.transaction_data;
    return res.status(200).json({
      paymentId:  result.id,
      qr_base64:  td?.qr_code_base64,
      qr_code:    td?.qr_code,
    });

  } catch (err) {
    console.error('[MP-PIX] Erro:', err.message);
    return res.status(500).json({ error: 'Erro ao criar PIX.', message: err.message });
  }
}
