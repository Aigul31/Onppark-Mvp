const { getAdminClient } = require('./_supabaseAdmin.js');

const supabase = getAdminClient();

/**
 * POST /api/init-database
 * Создает необходимые таблицы в базе данных
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Initializing database tables...');

  try {
    const results = [];

    // Пытаемся создать таблицы, используя простые запросы
    console.log('Creating profiles table...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError && profilesError.code === 'PGRST205') {
      // Таблица не существует, нужно создать через другой способ
      results.push('Profiles table needs to be created in Supabase Dashboard');
    } else {
      results.push('✓ Profiles table exists');
    }

    console.log('Checking chat_rooms table...');
    const { error: chatRoomsError } = await supabase
      .from('chat_rooms')
      .select('id')
      .limit(1);

    if (chatRoomsError && chatRoomsError.code === 'PGRST205') {
      results.push('Chat rooms table needs to be created in Supabase Dashboard');
    } else {
      results.push('✓ Chat rooms table exists');
    }

    console.log('Checking chat_messages table...');
    const { error: chatMessagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);

    if (chatMessagesError && chatMessagesError.code === 'PGRST205') {
      results.push('Chat messages table needs to be created in Supabase Dashboard');
    } else {
      results.push('✓ Chat messages table exists');
    }

    console.log('Checking statuses table...');
    const { error: statusesError } = await supabase
      .from('statuses')
      .select('id')
      .limit(1);

    if (statusesError && statusesError.code === 'PGRST205') {
      results.push('Statuses table needs to be created in Supabase Dashboard');
    } else {
      results.push('✓ Statuses table exists');
    }

    // Попытаемся создать демо-данные, если таблицы существуют
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .upsert({
        user_key: 'demo_user_1',
        name: 'Demo User',
        username: 'demo',
        telegram_id: 123456789
      })
      .select();

    if (!profileInsertError) {
      results.push('✓ Demo profile created');
    }

    return res.status(200).json({
      message: 'Database initialization check completed',
      results: results,
      sql_commands: {
        create_profiles: `
          CREATE TABLE IF NOT EXISTS profiles (
            id SERIAL PRIMARY KEY,
            user_key TEXT UNIQUE NOT NULL,
            user_id TEXT UNIQUE,
            telegram_id BIGINT UNIQUE,
            name TEXT NOT NULL,
            username TEXT,
            email TEXT,
            avatar_url TEXT,
            interests TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        create_statuses: `
          CREATE TABLE IF NOT EXISTS statuses (
            id SERIAL PRIMARY KEY,
            user_key TEXT NOT NULL,
            user_id TEXT,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            message TEXT NOT NULL,
            icon TEXT DEFAULT '📍',
            location TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL
          );
        `,
        create_chat_rooms: `
          CREATE TABLE IF NOT EXISTS chat_rooms (
            id SERIAL PRIMARY KEY,
            user1_key TEXT NOT NULL,
            user2_key TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            UNIQUE(user1_key, user2_key)
          );
        `,
        create_chat_messages: `
          CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            room_id INTEGER NOT NULL,
            sender_user_key TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      error: 'Database initialization failed', 
      details: error.message 
    });
  }
};