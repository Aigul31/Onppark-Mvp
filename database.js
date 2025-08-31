// Инициализация Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Временное хранилище для статусов (в памяти) - для быстрого доступа
let userStatuses = new Map();
let userProfiles = new Map();

console.log('Supabase database initialized');

// Функции для работы с данными
async function getAllProfiles() {
  try {
    return Array.from(userProfiles.values());
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

async function createProfile(profileData) {
  try {
    const profile = {
      ...profileData,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    userProfiles.set(profileData.user_id, profile);
    console.log('Profile saved:', profile);
    return profile;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

async function getAllStatuses() {
  try {
    // Фильтруем статусы старше 24 часов
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const validStatuses = Array.from(userStatuses.values()).filter(status => {
      const statusTime = new Date(status.created_at).getTime();
      return statusTime > oneDayAgo;
    });
    
    return validStatuses;
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return [];
  }
}

async function createStatus(statusData) {
  try {
    const status = {
      ...statusData,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    
    // Заменяем предыдущий статус пользователя если есть
    userStatuses.set(statusData.user_id, status);
    console.log('Status saved:', status);
    return status;
  } catch (error) {
    console.error('Error creating status:', error);
    throw error;
  }
}

async function updateUserStatus(userId, newStatusData) {
  try {
    const existingStatus = userStatuses.get(userId);
    if (existingStatus) {
      const updatedStatus = {
        ...existingStatus,
        ...newStatusData,
        updated_at: new Date().toISOString()
      };
      userStatuses.set(userId, updatedStatus);
      console.log('Status updated:', updatedStatus);
      return updatedStatus;
    } else {
      return await createStatus({ user_id: userId, ...newStatusData });
    }
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// Функции для сообщений
async function createMessagesTable() {
  try {
    // Создаем таблицу messages в Supabase если её нет
    const { error } = await supabase.rpc('create_messages_table');
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating messages table:', error);
    } else {
      console.log('Messages table ready');
    }
  } catch (error) {
    console.log('Messages table may already exist');
  }
}

async function sendMessage(fromUserId, toUserId, messageText) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        message: messageText,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    
    console.log('Message sent:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function getMessages(userId1, userId2) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Инициализация таблиц при запуске
createMessagesTable();

module.exports = {
  getAllProfiles,
  createProfile,
  getAllStatuses,
  createStatus,
  updateUserStatus,
  sendMessage,
  getMessages
};