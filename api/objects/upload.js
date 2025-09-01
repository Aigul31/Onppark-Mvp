import { supabaseAdmin, corsHeaders } from '../_supabaseAdmin.js'

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
    if (req.method === 'POST') {
      // Получение presigned URL для загрузки файла в Supabase Storage
      const { fileName, fileType, bucket = 'avatars' } = req.body

      if (!fileName) {
        return res.status(400).json({ error: 'fileName обязателен' })
      }

      // Генерируем уникальное имя файла с временной меткой
      const timestamp = Date.now()
      const uniqueFileName = `${timestamp}_${fileName}`

      // Создаем presigned URL для загрузки
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUploadUrl(uniqueFileName)

      if (error) {
        console.error('Error creating signed upload URL:', error)
        return res.status(500).json({ error: 'Failed to create upload URL' })
      }

      // Возвращаем URL для загрузки и публичный URL файла
      const publicURL = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName).data.publicUrl

      return res.status(200).json({
        uploadURL: data.signedUrl,
        publicURL: publicURL,
        fileName: uniqueFileName,
        bucket: bucket
      })
    }

    // Метод не поддерживается
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}