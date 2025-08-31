const { createClient } = require('@supabase/supabase-js');

// Простое подключение к Supabase используя ваш проект
const supabaseUrl = 'https://aigara939.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ2FyYTkzOSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU2NjMwMjcyLCJleHAiOjIwNzIyMDYyNzJ9.pGbgdV4gvNGZCkc3j0vDSKO6-Zs5nJWb_Cd3TQjHlXE';

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized:', supabaseUrl);

// Функции для работы с базой данных
async function getAllProfiles() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

async function createProfile(profileData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

async function getAllStatuses() {
  try {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Ограничиваем последними 50 статусами
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return [];
  }
}

async function createStatus(statusData) {
  try {
    const { data, error } = await supabase
      .from('statuses')
      .insert([statusData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating status:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  getAllProfiles,
  createProfile,
  getAllStatuses,
  createStatus
};