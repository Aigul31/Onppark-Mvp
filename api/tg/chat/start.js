const { getAdminClient } = require('../../_supabaseAdmin.js');
const { verifyTelegramInitData, createTelegramUserKey } = require('../../../lib/telegramAuth.js');

const supabase = getAdminClient();

/**
 * POST /api/tg/chat/start
 * Создает или находит комнату чата между двумя пользователями
 */
module.exports = async function handler(req, res) {
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
  console.log(`[${new Date().toISOString()}] POST /api/tg/chat/start - Started`);

  try {
    const { initData, target_user_key } = req.body;

    if (!initData || !target_user_key) {
      return res.status(400).json({ error: 'Missing initData or target_user_key' });
    }

    // Верификация Telegram initData
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const verification = verifyTelegramInitData(initData, botToken);
    if (!verification.success) {
      return res.status(401).json({ error: 'Invalid initData' });
    }

    const user = verification.user;
    const userKey = createTelegramUserKey(user.id);

    // Проверяем, что у пользователя есть активный статус
    const { data: userStatus } = await supabase
      .from('statuses')
      .select('id')
      .eq('user_key', userKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!userStatus) {
      return res.status(403).json({ 
        error: 'You need an active status to start a chat',
        code: 'NO_ACTIVE_STATUS'
      });
    }

    // Нормализуем порядок user_key для уникальности комнаты
    const [user1_key, user2_key] = [userKey, target_user_key].sort();

    // Ищем существующую комнату или создаем новую
    let { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('user1_key', user1_key)
      .eq('user2_key', user2_key)
      .single();

    if (roomError && roomError.code !== 'PGRST116') { // PGRST116 = not found
      console.log('Database error:', roomError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Если комнаты нет, создаем новую с временем истечения 12 часов
    if (!room) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // +12 часов
      
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          user1_key,
          user2_key,
          last_message_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        console.log('Error creating room:', createError);
        return res.status(500).json({ error: 'Failed to create room' });
      }

      room = newRoom;

      // Логирование метрики
      console.log(`[METRIC] chat_started: ${userKey} -> ${target_user_key}`);
    }

    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] POST /api/tg/chat/start - Success (${responseTime}ms)`);

    return res.status(200).json({ room_id: room.id });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] POST /api/tg/chat/start - Error (${responseTime}ms):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}