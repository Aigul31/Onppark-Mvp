// api/messages.js
const { getAdminClient } = require('./_supabaseAdmin');

module.exports = async (req, res) => {
  const supabase = getAdminClient();

  if (req.method === 'GET') {
    const { thread_id, user1, user2 } = req.query || {};
    
    let q = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100);
    
    if (thread_id) {
      q = q.eq('thread_id', thread_id);
    } else if (user1 && user2) {
      // Создаем thread_id из двух пользователей (сортируем для консистентности)
      const threadId = [user1, user2].sort().join('_');
      q = q.eq('thread_id', threadId);
    }

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { fromUserId, toUserId, message } = req.body;
    
    if (!fromUserId || !toUserId || !message) {
      return res.status(400).json({ error: 'fromUserId, toUserId, and message are required' });
    }
    
    // Создаем thread_id из двух пользователей (сортируем для консистентности)
    const threadId = [fromUserId, toUserId].sort().join('_');
    
    const messageData = {
      thread_id: threadId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message: message,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('messages').insert(messageData).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data?.[0] ?? null);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end('Method Not Allowed');
};