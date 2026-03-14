import { supabaseAdmin } from './_supabaseAdmin.js';

const WEEKLY_LIMIT = 20;

export default async function handler(req, res) {
  // ── PATCH: decrementa 1 crédito no banco (fire-and-forget safe) ──────────
  if (req.method === 'PATCH') {
    const { userId } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: 'userId obrigatório.' });

    const { error } = await supabaseAdmin.rpc('decrement_credits', { p_user_id: userId });
    if (error) {
      console.error('[Credits PATCH] Erro ao decrementar:', error.message);
      return res.status(500).json({ error: 'Erro ao decrementar crédito.' });
    }
    return res.status(200).json({ ok: true });
  }

  // ── POST: verifica e renova créditos se necessário ────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const { userId } = req.body ?? {};
  if (!userId) {
    return res.status(400).json({ error: 'userId obrigatório.' });
  }

  try {
    // Busca perfil atual
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('free_credits, credits_reset_at, subscription_status')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Perfil não encontrado.' });
    }

    // Usuário premium não precisa de créditos
    if (profile.subscription_status === 'active') {
      return res.status(200).json({ credits: null, isPremium: true });
    }

    const now = new Date();
    const resetAt = profile.credits_reset_at ? new Date(profile.credits_reset_at) : null;
    const needsReset = !resetAt || (now - resetAt) >= 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

    if (needsReset) {
      // Renovar créditos
      const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          free_credits: WEEKLY_LIMIT,
          credits_reset_at: now.toISOString(),
          next_credits_reset_at: nextReset.toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[Credits] Erro ao renovar créditos:', updateError);
        return res.status(500).json({ error: 'Erro ao renovar créditos.' });
      }

      console.log(`[Credits] Créditos renovados para userId=${userId}`);
      return res.status(200).json({ 
        credits: WEEKLY_LIMIT, 
        resetAt: now.toISOString(),
        nextResetAt: nextReset.toISOString(),
        renewed: true,
      });
    }

    // Retorna créditos atuais
    return res.status(200).json({ 
      credits: profile.free_credits ?? WEEKLY_LIMIT,
      resetAt: profile.credits_reset_at,
      nextResetAt: profile.next_credits_reset_at,
      renewed: false,
    });

  } catch (err) {
    console.error('[Credits] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
