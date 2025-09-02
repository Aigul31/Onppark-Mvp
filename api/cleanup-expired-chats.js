const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase с сервисным ключом
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Очистка истекших чатов и связанных сообщений
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] POST /api/cleanup-expired-chats - Started`);

  try {
    const now = new Date().toISOString();

    // Получаем истекшие комнаты чата
    const { data: expiredRooms, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('id')
      .lt('expires_at', now);

    if (fetchError) {
      console.log('Error fetching expired rooms:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!expiredRooms || expiredRooms.length === 0) {
      const responseTime = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] POST /api/cleanup-expired-chats - No expired chats found (${responseTime}ms)`);
      return res.status(200).json({ 
        cleaned_rooms: 0, 
        cleaned_messages: 0,
        message: 'No expired chats found'
      });
    }

    const roomIds = expiredRooms.map(room => room.id);
    console.log(`[CLEANUP] Found ${roomIds.length} expired chat rooms to delete`);

    // Удаляем сообщения из истекших комнат
    const { error: messagesDeleteError, count: deletedMessagesCount } = await supabase
      .from('chat_messages')
      .delete()
      .in('room_id', roomIds);

    if (messagesDeleteError) {
      console.log('Error deleting messages:', messagesDeleteError);
      return res.status(500).json({ error: 'Failed to delete messages' });
    }

    // Удаляем сами комнаты
    const { error: roomsDeleteError, count: deletedRoomsCount } = await supabase
      .from('chat_rooms')
      .delete()
      .in('id', roomIds);

    if (roomsDeleteError) {
      console.log('Error deleting rooms:', roomsDeleteError);
      return res.status(500).json({ error: 'Failed to delete rooms' });
    }

    const responseTime = Date.now() - startTime;
    const cleanedRooms = deletedRoomsCount || roomIds.length;
    const cleanedMessages = deletedMessagesCount || 0;

    console.log(`[CLEANUP] Cleaned ${cleanedRooms} expired chat rooms and ${cleanedMessages} messages`);
    console.log(`[${new Date().toISOString()}] POST /api/cleanup-expired-chats - Success (${responseTime}ms)`);

    return res.status(200).json({
      cleaned_rooms: cleanedRooms,
      cleaned_messages: cleanedMessages,
      message: `Successfully cleaned ${cleanedRooms} expired chats`
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] POST /api/cleanup-expired-chats - Error (${responseTime}ms):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};