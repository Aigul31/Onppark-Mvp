const { getAdminClient } = require('../_supabaseAdmin.js');
const { verifyTelegramInitData, createTelegramUserKey } = require('../../lib/telegramAuth.js');

const supabase = getAdminClient();

/**
 * POST /api/tg/upsert-profile
 * Создает или обновляет профиль пользователя из Telegram Mini App
 */
export default async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] POST /api/tg/upsert-profile - Started`);

  try {
    const { initData } = req.body;

    if (!initData) {
      console.log('Error: Missing initData');
      return res.status(400).json({ error: 'Missing initData' });
    }

    // Верификация Telegram initData
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.log('Error: Missing TELEGRAM_BOT_TOKEN');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const verification = verifyTelegramInitData(initData, botToken);
    if (!verification.success) {
      console.log('Error: Telegram verification failed:', verification.error);
      return res.status(401).json({ error: 'Invalid initData', details: verification.error });
    }

    const user = verification.user;
    const userKey = createTelegramUserKey(user.id);

    // Upsert профиля пользователя
    const profileData = {
      user_key: userKey,
      user_id: user.id.toString(), // совместимость с существующей схемой
      telegram_id: user.id.toString(),
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
      username: user.username,
      avatar_url: user.photo_url,
      avatar_url_full: user.photo_url,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'user_key',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.log('Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Логирование метрики
    console.log(`[METRIC] user_profile_updated: ${userKey}`);

    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] POST /api/tg/upsert-profile - Success (${responseTime}ms)`);

    return res.status(200).json({
      user_key: data.user_key,
      name: data.name,
      username: data.username,
      avatar_url: data.avatar_url
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] POST /api/tg/upsert-profile - Error (${responseTime}ms):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}