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
      // Получение активных статусов (не старше 24 часов)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: statuses, error } = await supabaseAdmin
        .from('user_status')
        .select(`
          *,
          profiles:profile_id (
            display_name,
            avatar_url
          )
        `)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching statuses:', error)
        return res.status(500).json({ error: 'Failed to fetch statuses' })
      }

      return res.status(200).json(statuses || [])
    }

    if (req.method === 'POST') {
      // Создание нового статуса
      const { profile_id, status_text, location, mood } = req.body

      if (!profile_id || !status_text) {
        return res.status(400).json({ 
          error: 'profile_id и status_text обязательны' 
        })
      }

      const { data: status, error } = await supabaseAdmin
        .from('user_status')
        .insert([{
          profile_id,
          status_text,
          location: location || null,
          mood: mood || 'neutral',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating status:', error)
        return res.status(500).json({ error: 'Failed to create status' })
      }

      return res.status(201).json(status)
    }

    if (req.method === 'PUT') {
      // Обновление существующего статуса
      const { id, status_text, location, mood } = req.body

      if (!id) {
        return res.status(400).json({ error: 'id статуса обязателен' })
      }

      const updateData = {
        updated_at: new Date().toISOString()
      }

      if (status_text) updateData.status_text = status_text
      if (location !== undefined) updateData.location = location
      if (mood) updateData.mood = mood

      const { data: status, error } = await supabaseAdmin
        .from('user_status')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating status:', error)
        return res.status(500).json({ error: 'Failed to update status' })
      }

      return res.status(200).json(status)
    }

    // Метод не поддерживается
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}