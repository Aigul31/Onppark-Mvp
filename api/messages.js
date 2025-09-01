import { supabaseAdmin, corsHeaders } from './_supabaseAdmin.js'

export default async function handler(req, res) {
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
      // Получение сообщений для чата между двумя пользователями
      const { sender_id, receiver_id } = req.query

      if (!sender_id || !receiver_id) {
        return res.status(400).json({ 
          error: 'sender_id и receiver_id обязательны' 
        })
      }

      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            display_name,
            avatar_url
          ),
          receiver:receiver_id (
            display_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${sender_id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${sender_id})`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return res.status(500).json({ error: 'Failed to fetch messages' })
      }

      return res.status(200).json(messages || [])
    }

    if (req.method === 'POST') {
      // Отправка нового сообщения
      const { sender_id, receiver_id, message_text, message_type } = req.body

      if (!sender_id || !receiver_id || !message_text) {
        return res.status(400).json({ 
          error: 'sender_id, receiver_id и message_text обязательны' 
        })
      }

      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert([{
          sender_id,
          receiver_id,
          message_text,
          message_type: message_type || 'text',
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          sender:sender_id (
            display_name,
            avatar_url
          ),
          receiver:receiver_id (
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error creating message:', error)
        return res.status(500).json({ error: 'Failed to send message' })
      }

      return res.status(201).json(message)
    }

    // Метод не поддерживается
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}