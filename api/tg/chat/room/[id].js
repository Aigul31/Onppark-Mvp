const { getAdminClient } = require('../../../_supabaseAdmin.js');
const { verifyTelegramInitData, createTelegramUserKey } = require('../../../../lib/telegramAuth.js');

const supabase = getAdminClient();

/**
 * GET /api/tg/chat/room/[id]
 * Получает сообщения из комнаты чата
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const roomId = req.query.id;
  console.log(`[${new Date().toISOString()}] GET /api/tg/chat/room/${roomId} - Started`);

  try {
    const { initData } = req.query;

    if (!initData) {
      return res.status(400).json({ error: 'Missing initData' });
    }

    // Верификация Telegram initData
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const verification = verifyTelegramInitData(initData, botToken);
    if (!verification.success) {
      return res.status(401).json({ error: 'Invalid initData' });
    }

    const user = verification.user;
    const userKey = createTelegramUserKey(user.id);

    // Проверяем, что пользователь участник этой комнаты
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, user1_key, user2_key')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.user1_key !== userKey && room.user2_key !== userKey) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    // Получаем последние сообщения
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select(`
        id,
        sender_user_key,
        text,
        created_at,
        profiles!chat_messages_sender_user_key_fkey(name, username, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) {
      console.log('Database error:', messagesError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Форматируем сообщения
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      sender_user_key: msg.sender_user_key,
      sender_name: msg.profiles?.name || msg.profiles?.username || 'Anonymous',
      text: msg.text,
      created_at: msg.created_at,
      is_own: msg.sender_user_key === userKey
    })).reverse(); // Возвращаем в прямом порядке (старые -> новые)

    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] GET /api/tg/chat/room/${roomId} - Success: ${formattedMessages.length} messages (${responseTime}ms)`);

    return res.status(200).json({ messages: formattedMessages });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] GET /api/tg/chat/room/${roomId} - Error (${responseTime}ms):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}