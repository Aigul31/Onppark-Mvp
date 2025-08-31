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

// Временное хранилище для сообщений в памяти
let userMessages = new Map();

// Функции для сообщений - используем память вместо Supabase для стабильности
async function sendMessage(fromUserId, toUserId, messageText) {
  try {
    const message = {
      id: Date.now(),
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message: messageText,
      created_at: new Date().toISOString()
    };
    
    // Создаем ключ для чата между двумя пользователями
    const chatKey = [fromUserId, toUserId].sort().join('_');
    
    if (!userMessages.has(chatKey)) {
      userMessages.set(chatKey, []);
    }
    
    userMessages.get(chatKey).push(message);
    console.log('Message sent:', message);
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function getMessages(userId1, userId2) {
  try {
    // Создаем ключ для чата между двумя пользователями
    const chatKey = [userId1, userId2].sort().join('_');
    
    const messages = userMessages.get(chatKey) || [];
    console.log('Retrieved messages:', messages);
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

module.exports = {
  getAllProfiles,
  createProfile,
  getAllStatuses,
  createStatus,
  updateUserStatus,
  sendMessage,
  getMessages
};