const { getAdminClient } = require('./api/_supabaseAdmin.js');

const supabase = getAdminClient();

async function initializeDatabase() {
  console.log('Initializing database tables...');

  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS profiles_user_key_idx ON profiles(user_key);
        CREATE INDEX IF NOT EXISTS profiles_telegram_id_idx ON profiles(telegram_id);
      `
    });
    
    if (profilesError) {
      console.log('Profiles table creation error (may already exist):', profilesError.message);
    } else {
      console.log('✓ Profiles table created');
    }

    // Create statuses table
    const { error: statusesError } = await supabase.rpc('exec_sql', {
      sql: `
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
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (user_key) REFERENCES profiles(user_key) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS statuses_user_key_idx ON statuses(user_key);
        CREATE INDEX IF NOT EXISTS statuses_expires_at_idx ON statuses(expires_at);
        CREATE INDEX IF NOT EXISTS statuses_location_idx ON statuses(latitude, longitude);
      `
    });
    
    if (statusesError) {
      console.log('Statuses table creation error (may already exist):', statusesError.message);
    } else {
      console.log('✓ Statuses table created');
    }

    // Create chat_rooms table
    const { error: chatRoomsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id SERIAL PRIMARY KEY,
          user1_key TEXT NOT NULL,
          user2_key TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (user1_key) REFERENCES profiles(user_key) ON DELETE CASCADE,
          FOREIGN KEY (user2_key) REFERENCES profiles(user_key) ON DELETE CASCADE,
          UNIQUE(user1_key, user2_key)
        );
        
        CREATE INDEX IF NOT EXISTS chat_rooms_users_idx ON chat_rooms(user1_key, user2_key);
        CREATE INDEX IF NOT EXISTS chat_rooms_expires_at_idx ON chat_rooms(expires_at);
      `
    });
    
    if (chatRoomsError) {
      console.log('Chat rooms table creation error (may already exist):', chatRoomsError.message);
    } else {
      console.log('✓ Chat rooms table created');
    }

    // Create chat_messages table
    const { error: chatMessagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL,
          sender_user_key TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
          FOREIGN KEY (sender_user_key) REFERENCES profiles(user_key) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON chat_messages(room_id);
        CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON chat_messages(sender_user_key);
        CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
      `
    });
    
    if (chatMessagesError) {
      console.log('Chat messages table creation error (may already exist):', chatMessagesError.message);
    } else {
      console.log('✓ Chat messages table created');
    }

    // Create sessions table for authentication
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP WITH TIME ZONE NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
      `
    });
    
    if (sessionsError) {
      console.log('Sessions table creation error (may already exist):', sessionsError.message);
    } else {
      console.log('✓ Sessions table created');
    }

    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('Database ready!');
    process.exit(0);
  });
}

module.exports = { initializeDatabase };