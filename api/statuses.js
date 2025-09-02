// api/statuses.js - Обновленный эндпоинт для получения активных статусов с профилями  
const { getAdminClient } = require('./_supabaseAdmin');

module.exports = async (req, res) => {
  const supabase = getAdminClient();
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] GET /api/statuses - Started`);

    try {
      const { since, bbox } = req.query;

      let query = supabase
        .from('statuses')
        .select(`
          id,
          user_key,
          user_id,
          latitude,
          longitude,
          message,
          icon,
          location,
          created_at,
          expires_at,
          profiles(name, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Фильтр по активным статусам (если есть expires_at)
      if (req.query.active === 'true') {
        query = query.gt('expires_at', new Date().toISOString());
      }

      // Фильтр по времени
      if (since) {
        query = query.gt('created_at', since);
      }

      // Фильтр по географической области (bbox format: "lat1,lng1,lat2,lng2")
      if (bbox) {
        const [lat1, lng1, lat2, lng2] = bbox.split(',').map(parseFloat);
        if (lat1 && lng1 && lat2 && lng2) {
          query = query
            .gte('latitude', Math.min(lat1, lat2))
            .lte('latitude', Math.max(lat1, lat2))
            .gte('longitude', Math.min(lng1, lng2))
            .lte('longitude', Math.max(lng1, lng2));
        }
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.log('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      // Преобразуем данные в нужный формат для совместимости
      const items = data.map(status => ({
        id: status.id,
        user_key: status.user_key || `legacy:${status.user_id}`,
        user_id: status.user_id, // для обратной совместимости
        name: status.profiles?.name || status.profiles?.username || 'Anonymous',
        username: status.profiles?.username,
        avatar_url: status.profiles?.avatar_url,
        latitude: Number(status.latitude),
        longitude: Number(status.longitude),
        message: status.message,
        icon: status.icon,
        location: status.location,
        created_at: status.created_at,
        expires_at: status.expires_at
      }));

      // Логирование метрики
      if (items.length > 0) {
        console.log(`[METRIC] daily_active_statuses: ${items.length} statuses served`);
      }

      const responseTime = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] GET /api/statuses - Success: ${items.length} items (${responseTime}ms)`);

      // Возвращаем в двух форматах для совместимости
      if (req.query.format === 'items') {
        return res.status(200).json({ items });
      } else {
        return res.status(200).json(items); // старый формат для совместимости
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] GET /api/statuses - Error (${responseTime}ms):`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('statuses')
      .insert([{ 
        user_id: req.body.user_id,
        user_key: req.body.user_key || `legacy:${req.body.user_id}`,
        latitude: req.body.latitude, 
        longitude: req.body.longitude, 
        icon: req.body.icon, 
        message: req.body.message,
        location: req.body.location || '',
        expires_at: req.body.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }])
      .select();
      
    if (error) return res.status(400).json({ error: error.message });
    
    console.log(`[METRIC] status_published: ${req.body.user_key || req.body.user_id}`);
    return res.status(201).json(data?.[0] ?? null);
  }

  if (req.method === 'PUT') {
    const { id, latitude, longitude, icon, message } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен для обновления' });

    const updateFields = {};
    if (latitude !== undefined) updateFields.latitude = latitude;
    if (longitude !== undefined) updateFields.longitude = longitude;
    if (icon !== undefined) updateFields.icon = icon;
    if (message !== undefined) updateFields.message = message;
    updateFields.updated_at = new Date().toISOString();
    
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