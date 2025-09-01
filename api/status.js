// api/status.js  
const { getAdminClient } = require('./_supabaseAdmin');

module.exports = async (req, res) => {
  const supabase = getAdminClient();

  if (req.method === 'GET') {
    // Получение всех статусов без фильтрации по времени
    const { data, error } = await supabase
      .from('statuses')
      .select('id, user_id, latitude, longitude, icon, message, created_at')
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('statuses')
      .insert([{ 
        user_id: req.body.user_id,
        latitude: req.body.latitude, 
        longitude: req.body.longitude, 
        icon: req.body.icon, 
        message: req.body.message 
      }])
      .select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data?.[0] ?? null);
  }

  if (req.method === 'PUT') {
    const { id, latitude, longitude, icon, message } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен для обновления' });

    // Подготавливаем только те поля, которые нужно обновить
    const updateFields = {};
    if (latitude !== undefined) updateFields.latitude = latitude;
    if (longitude !== undefined) updateFields.longitude = longitude;
    if (icon !== undefined) updateFields.icon = icon;
    if (message !== undefined) updateFields.message = message;
    
    const { data, error } = await supabase
      .from('statuses')
      .update(updateFields)
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data?.[0] ?? null);
  }

  res.setHeader('Allow', 'GET, POST, PUT');
  return res.status(405).end('Method Not Allowed');
};