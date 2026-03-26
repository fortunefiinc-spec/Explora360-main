export default async function handler(req, res) {
  // CORS — accepteer alle explora360.nl origins
  const origin = req.headers.origin || '';
  const allowed = ['https://www.explora360.nl', 'https://explora360.nl'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.explora360.nl');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL   = 'https://yhzpsfpptiojkkaqrzgd.supabase.co';
  const SVC_KEY  = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_ID = 'b31d838e-dcee-426e-bfac-d9ae069ba7a7';

  if (!SVC_KEY) {
    return res.status(500).json({ error: 'Service key not configured on Vercel' });
  }

  // Verifieer admin token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  try {
    const verifyRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: {
        'apikey': SVC_KEY,
        'Authorization': authHeader
      }
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Token verification failed' });
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.id || verifyData.id !== ADMIN_ID) {
      return res.status(403).json({ error: 'Admin access only' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Auth check failed: ' + e.message });
  }

  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { action, payload } = body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {
    let result, data;

    switch (action) {

      case 'create_user':
        result = await fetch(`${SB_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SVC_KEY,
            'Authorization': `Bearer ${SVC_KEY}`
          },
          body: JSON.stringify({
            email: payload.email,
            password: payload.password,
            email_confirm: true
          })
        });
        data = await result.json();
        return res.status(result.status).json(data);

      case 'update_user':
        result = await fetch(`${SB_URL}/auth/v1/admin/users/${payload.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SVC_KEY,
            'Authorization': `Bearer ${SVC_KEY}`
          },
          body: JSON.stringify({ password: payload.password })
        });
        data = await result.json();
        return res.status(result.status).json(data);

      case 'delete_user':
        result = await fetch(`${SB_URL}/auth/v1/admin/users/${payload.id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SVC_KEY,
            'Authorization': `Bearer ${SVC_KEY}`
          }
        });
        return res.status(result.status).json({ success: result.ok });

      default:
        return res.status(400).json({ error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
