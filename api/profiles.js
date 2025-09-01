const { supabaseAdmin, corsHeaders } = require('./_supabaseAdmin.js')

module.exports = async function handler(req, res) {
  // Обработка CORS preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  // Устанавливаем CORS заголовки
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  try {
    if (req.method === 'GET') {
      // Получение всех профилей
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching profiles:', error)
        return res.status(500).json({ error: 'Failed to fetch profiles' })
      }

      return res.status(200).json(profiles || [])
    }

    if (req.method === 'POST') {
      // Создание нового профиля
      const profileData = req.body

      // Валидация обязательных полей
      if (!profileData.display_name || !profileData.age) {
        return res.status(400).json({ 
          error: 'display_name и age обязательны' 
        })
      }

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .insert([{
          display_name: profileData.display_name,
          age: parseInt(profileData.age),
          status: profileData.status || 'available',
          interests: profileData.interests || [],
          avatar_url: profileData.avatar_url || null,
          location: profileData.location || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return res.status(500).json({ error: 'Failed to create profile' })
      }

      return res.status(201).json(profile)
    }

    // Метод не поддерживается
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}