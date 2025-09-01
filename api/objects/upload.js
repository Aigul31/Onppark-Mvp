// api/objects/upload.js
const { getAdminClient } = require('../_supabaseAdmin');
const Busboy = require('busboy');

// Отключаем json-парсер для этого роута — Vercel будет отдавать сырое тело
module.exports.config = {
  api: { bodyParser: false },
};

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    const files = [];
    bb.on('file', (_name, file, info) => {
      const chunks = [];
      file.on('data', (d) => chunks.push(d));
      file.on('end', () => {
        files.push({
          filename: info.filename,
          mime: info.mimeType || info.mime || 'application/octet-stream',
          buffer: Buffer.concat(chunks),
        });
      });
    });
    bb.on('finish', () => resolve({ files }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getAdminClient();

  try {
    const { files } = await parseMultipart(req);
    if (!files?.length) return res.status(400).json({ error: 'No file' });

    const file = files[0];
    const ext = (file.filename.split('.').pop() || 'jpg').toLowerCase();
    const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase
      .storage
      .from('avatars') // ← назови свой bucket
      .upload(path, file.buffer, { contentType: file.mime, upsert: false });

    if (error) return res.status(500).json({ error: error.message });

    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    return res.status(200).json({ path, url: pub?.publicUrl ?? null });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
};