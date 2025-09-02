const crypto = require('crypto');
const { getAdminClient } = require('../_supabaseAdmin.js');

const supabase = getAdminClient();

function verify(initData) {
  const p = new URLSearchParams(initData);
  const h = p.get('hash'); 
  if (!h) return null;
  
  const arr = []; 
  for (const [k, v] of p) {
    if (k !== 'hash') arr.push(`${k}=${v}`);
  }
  arr.sort(); 
  const str = arr.join('\n');
  
  const secret = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN, 'utf8').digest();
  const sig = crypto.createHmac('sha256', secret).update(str).digest('hex');
  if (sig !== h) return null;
  
  const user = p.get('user'); 
  return user ? JSON.parse(user) : null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')
      .end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData, latitude, longitude, message, icon, location } = req.body || {};
    const tgUser = verify(initData || '');
    
    if (!tgUser) {
      return res.status(401).json({ error: { message: 'Bad Telegram signature' } });
    }

    const user_key = `tg:${tgUser.id}`;
    
    // один активный статус на пользователя: деактивируем старые
    await supabase.from('statuses').update({ is_active: false })
      .eq('user_key', user_key).eq('is_active', true);

    const { data, error } = await supabase.from('statuses').insert({
      user_key,
      latitude: latitude || null,
      longitude: longitude || null,
      message: message || null,
      icon: icon || null,
      location: location || null,
      is_active: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }).select().single();

    if (error) throw error;

    res.setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')
      .status(200).json({ data });
      
  } catch (e) {
    res.status(400).json({ error: { message: e?.message || String(e) } });
  }
};