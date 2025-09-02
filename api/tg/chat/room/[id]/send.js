const { getAdminClient } = require('../../../../_supabaseAdmin.js');
const { verifyTelegramInitData, createTelegramUserKey, extractTelegramId } = require('../../../../../lib/telegramAuth.js');

const supabase = getAdminClient();

/**
 * POST /api/tg/chat/room/[id]/send
 * Отправляет сообщение в комнату чата
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
  const roomId = req.query.id;
  console.log(`[${new Date().toISOString()}] POST /api/tg/chat/room/${roomId}/send - Started`);

  try {
    const { initData, text } = req.body;

    if (!initData || !text) {
      return res.status(400).json({ error: 'Missing initData or text' });
    }

    // Верификация Telegram initData
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const verification = verifyTelegramInitData(initData, botToken);
    if (!verification.success) {
      return res.status(401).json({ error: 'Invalid initData' });
    }

    const user = verification.user;
    const userKey = createTelegramUserKey(user.id);

    // Автоматическая очистка истекших чатов
    const now = new Date().toISOString();
    const { data: expiredRooms } = await supabase
      .from('chat_rooms')
      .select('id')
      .lt('expires_at', now);
    
    if (expiredRooms && expiredRooms.length > 0) {
      const roomIds = expiredRooms.map(r => r.id);
      await supabase.from('chat_messages').delete().in('room_id', roomIds);
      await supabase.from('chat_rooms').delete().in('id', roomIds);
    }

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

    // Определяем получателя
    const recipientUserKey = room.user1_key === userKey ? room.user2_key : room.user1_key;

    // Сохраняем сообщение
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_user_key: userKey,
        text: text.trim()
      })
      .select()
      .single();

    if (messageError) {
      console.log('Database error:', messageError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Обновляем время последнего сообщения в комнате
    await supabase
      .from('chat_rooms')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', roomId);

    // Отправляем уведомление получателю через Telegram Bot
    try {
      const recipientTelegramId = extractTelegramId(recipientUserKey);
      if (recipientTelegramId && process.env.TELEGRAM_BOT_TOKEN) {
        await sendTelegramNotification(
          recipientTelegramId,
          `💬 Новое сообщение от ${user.first_name}: "${text}"`,
          roomId
        );
      }
    } catch (notificationError) {
      console.log('Notification error (non-critical):', notificationError);
    }

    const responseTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] POST /api/tg/chat/room/${roomId}/send - Success (${responseTime}ms)`);

    return res.status(200).json({ success: true, message_id: message.id });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] POST /api/tg/chat/room/${roomId}/send - Error (${responseTime}ms):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Отправляет уведомление пользователю через Telegram Bot API
 */
async function sendTelegramNotification(telegramId, text, roomId) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'onpark_bot'; // нужно будет добавить в env
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const deepLink = `https://t.me/${botUsername}?startapp=chat&room=${roomId}`;
  const keyboard = {
    inline_keyboard: [[
      { text: '💬 Открыть чат', url: deepLink }
    ]]
  };

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId,
      text: text,
      reply_markup: keyboard
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  console.log(`[NOTIFICATION] Sent to ${telegramId}: ${text}`);
}