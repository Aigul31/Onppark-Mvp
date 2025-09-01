// api/messages.js
const { getAdminClient } = require('./_supabaseAdmin');

module.exports = async (req, res) => {
  const supabase = getAdminClient();

  if (req.method === 'GET') {
    const { thread_id } = req.query || {};
    let q = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(100);
    if (thread_id) q = q.eq('thread_id', thread_id);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('messages').insert(req.body).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data?.[0] ?? null);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
};