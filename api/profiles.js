// api/profiles.js
const { getAdminClient } = require('./_supabaseAdmin');

module.exports = async (req, res) => {
  const supabase = getAdminClient();

  if (req.method === 'GET') {
    const { email } = req.query;
    
    if (email) {
      // Поиск пользователя по email для восстановления пароля
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, password, age, avatar_url')
        .eq('email', email)
        .single();
      
      if (error) return res.status(404).json({ error: 'Пользователь не найден' });
      return res.status(200).json(data);
    } else {
      // вернём публичные поля профиля — адаптируем по схеме OnPark
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, age, status, interests, avatar_url, location, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100);
    }

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // предполагаем, что body — JSON; Vercel парсит JSON по умолчанию
    const profileData = req.body;
    console.log('Received profile:', profileData);
    
    // Валидация обязательных полей
    if (!profileData.display_name && !profileData.name) {
      return res.status(400).json({ error: 'display_name или name обязательны' });
    }

    // Подготавливаем данные для вставки
    const insertData = {
      user_id: profileData.user_id,
      display_name: profileData.display_name || profileData.name,
      email: profileData.email,
      password: profileData.password,
      age: parseInt(profileData.age),
      status: profileData.status || 'available',
      interests: profileData.interests || '',
      avatar_url: profileData.avatar_url || null,
      location: profileData.location || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(insertData)
      .select();
      
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data?.[0] ?? null);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
};