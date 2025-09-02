const { getAdminClient } = require('./_supabaseAdmin');

const supabase = getAdminClient();

module.exports = async function handler(req, res) {
  try {
    const since = req.query.since ? String(req.query.since) :
      new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    const { data: items, error } = await supabase
      .from('statuses')
      .select('id,user_key,latitude,longitude,message,icon,location,created_at,is_active,expires_at')
      .gte('created_at', since)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    // Подтянем имена из profiles
    const keys = Array.from(new Set((items || []).map(x => x.user_key)));
    let names = {};
    
    if (keys.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_key,name,avatar_url')
        .in('user_key', keys);
        
      (profs || []).forEach(p => { 
        names[p.user_key] = { 
          name: p.name || null, 
          avatar_url: p.avatar_url || null 
        }; 
      });
    }

    const normalized = (items || []).map(s => ({
      ...s,
      latitude: typeof s.latitude === 'number' ? s.latitude : Number(s.latitude),
      longitude: typeof s.longitude === 'number' ? s.longitude : Number(s.longitude),
      name: names[s.user_key]?.name || null,
      avatar_url: names[s.user_key]?.avatar_url || null
    })).filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));

    res.setHeader('Access-Control-Allow-Origin', '*')
      .status(200)
      .json({ items: normalized });
      
  } catch (e) {
    res.status(400).json({ error: { message: e?.message || String(e) } });
  }
};