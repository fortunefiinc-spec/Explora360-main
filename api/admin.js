export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://www.explora360.nl');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SB_URL  = 'https://yhzpsfpptiojkkaqrzgd.supabase.co';
  const SVC_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_ID = 'b31d838e-dcee-426e-bfac-d9ae069ba7a7';

  if (!SVC_KEY) return res.status(500).json({ error: 'Service key not configured' });

  // Verifieer dat aanvrager de admin is via anon token
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  // Verifieer de JWT token via Supabase
  const verifyRes = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { 'apikey': SVC_KEY, 'Authorization': authHeader }
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.id || verifyData.id !== ADMIN_ID) {
    return res.status(403).json({ error: 'Forbidden — admin only' });
  }

  const { action, payload } = req.body;

  try {
    let result;

    switch (action) {

      case 'create_user':
        result = await fetch(`${SB_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` },
          body: JSON.stringify({ email: payload.email, password: payload.password, email_confirm: true })
        });
        return res.status(result.status).json(await result.json());

      case 'update_user':
        result = await fetch(`${SB_URL}/auth/v1/admin/users/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` },
          body: JSON.stringify({ password: payload.password })
        });
        return res.status(result.status).json(await result.json());

      case 'delete_user':
        result = await fetch(`${SB_URL}/auth/v1/admin/users/${payload.id}`, {
          method: 'DELETE',
          headers: { 'apikey': SVC_KEY, 'Authorization': `Bearer ${SVC_KEY}` }
        });
        return res.status(result.status).json({ success: result.ok });

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
