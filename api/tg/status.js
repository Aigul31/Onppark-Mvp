const { getAdminClient } = require('../_supabaseAdmin.js');
const { verifyTelegramInitData, createTelegramUserKey } = require('../../lib/telegramAuth.js');

const supabase = getAdminClient();

/**
 * POST /api/tg/status  
 * Создает или обновляет статус пользователя (один активный статус на пользователя)
 */
export default async function handler(req, res) {
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
  console.log(`[${new Date().toISOString()}] POST /api/tg/status - Started`);

  try {
    const { initData, latitude, longitude, message, icon, location } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'Missing initData' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    // Верификация Telegram initData
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const verification = verifyTelegramInitData(initData, botToken);
    if (!verification.success) {
      return res.status(401).json({ error: 'Invalid initData' });
    }

    const user = verification.user;
    const userKey = createTelegramUserKey(user.id);

    // Удаляем старый статус пользователя (если есть)
    await supabase
      .from('statuses')
      .delete()
      .eq('user_key', userKey);

    // Создаем новый статус с автоматическим expires_at (24 часа)
    const statusData = {
      user_id: user.id.toString(), // совместимость
      user_key: userKey,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      message: message || '',
      icon: icon || 'location',
      location: location || '',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
    };

    const { data, error } = await supabase
      .from('statuses')
      .insert(statusData)
      .select()
      .single();

    if (error) {
      console.log('Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Логирование метрики
    console.log(`[METRIC] status_published: ${userKey} at (${latitude}, ${longitude})`);

    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] POST /api/tg/status - Success (${responseTime}ms)`);

    return res.status(200).json(data);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] POST /api/tg/status - Error (${responseTime}ms):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}