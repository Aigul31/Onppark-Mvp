// api/status.js  
const { getAdminClient } = require('./_supabaseAdmin');

module.exports = async (req, res) => {
  const supabase = getAdminClient();

  if (req.method === 'GET') {
    // Получение активных статусов (не старше 24 часов)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_status')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('user_status').insert(req.body).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data?.[0] ?? null);
  }

  if (req.method === 'PUT') {
    const { id, ...updateData } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен для обновления' });

    const { data, error } = await supabase
      .from('user_status')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data?.[0] ?? null);
  }

  res.setHeader('Allow', 'GET, POST, PUT');
  return res.status(405).end('Method Not Allowed');
};