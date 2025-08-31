// Временное хранилище для статусов (в памяти)
let userStatuses = new Map();
let userProfiles = new Map();

console.log('In-memory database initialized');

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

module.exports = {
  getAllProfiles,
  createProfile,
  getAllStatuses,
  createStatus,
  updateUserStatus
};