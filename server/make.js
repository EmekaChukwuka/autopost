import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { scheduleJob } from 'node-schedule';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// MySQL Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Platform Configuration
const PLATFORM_CONFIG = {
  facebook: {
    scope: 'pages_manage_posts,pages_read_engagement',
    webhook: process.env.MAKE_FACEBOOK_WEBHOOK
  },
  twitter: {
    scope: 'tweet.read tweet.write',
    webhook: process.env.MAKE_TWITTER_WEBHOOK
  },
  linkedin: {
    scope: 'w_member_social',
    webhook: process.env.MAKE_LINKEDIN_WEBHOOK
  }
};

// OAuth Endpoints
app.get('/auth/make', (req, res) => {
  const { platform } = req.query;
  
  if (!PLATFORM_CONFIG[platform]) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  const authUrl = new URL('https://www.make.com/oauth/authorize');
  authUrl.searchParams.append('client_id', process.env.MAKE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', getRedirectUri());
  authUrl.searchParams.append('scope', PLATFORM_CONFIG[platform].scope);
  authUrl.searchParams.append('state', platform);
  authUrl.searchParams.append('response_type', 'code');

  res.redirect(authUrl.toString());
});

app.get('/auth/make/callback', async (req, res) => {
  const { code, error, state: platform } = req.query;

  if (error) {
    return res.redirect(`http://localhost:3000/error?message=${encodeURIComponent(error)}`);
  }

  try {
    const { data } = await axios.post('https://www.make.com/oauth/token', new URLSearchParams({
      client_id: process.env.MAKE_CLIENT_ID,
      client_secret: process.env.MAKE_CLIENT_SECRET,
      code,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    await storeToken(data, platform);
    res.redirect(`http://localhost:3000/success?platform=${platform}`);
  } catch (err) {
    console.error('OAuth Error:', err.response?.data || err.message);
    res.redirect('http://localhost:3000/error');
  }
});

// Auto-Posting Endpoint
app.post('/schedule-post', async (req, res) => {
  const { userId, platform, content, scheduledTime } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO scheduled_posts (user_id, platform, content, scheduled_time) VALUES (?, ?, ?, ?)',
      [userId, platform, content, new Date(scheduledTime)]
    );

    scheduleJob(new Date(scheduledTime), async () => {
      const conn = await pool.getConnection();
      try {
        const [token] = await conn.query(
          'SELECT access_token FROM make_tokens WHERE user_id = ? AND platform = ?',
          [userId, platform]
        );

        await axios.post(PLATFORM_CONFIG[platform].webhook, { 
          content,
          access_token: token[0]?.access_token
        });

        await conn.query(
          'UPDATE scheduled_posts SET status = ? WHERE id = ?',
          ['posted', result.insertId]
        );
      } catch (err) {
        await conn.query(
          'UPDATE scheduled_posts SET status = ? WHERE id = ?',
          ['failed', result.insertId]
        );
      } finally {
        conn.release();
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Scheduling failed' });
  }
});

// Helpers
function getRedirectUri() {
  return process.env.NODE_ENV === 'production'
    ? 'https://yourdomain.com/auth/make/callback'
    : 'http://localhost:3001/auth/make/callback';
}

async function storeToken(tokenData, platform) {
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
  await pool.query(
    `INSERT INTO make_tokens 
    (user_id, platform, access_token, refresh_token, expires_at) 
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    access_token = VALUES(access_token),
    refresh_token = VALUES(refresh_token),
    expires_at = VALUES(expires_at)`,
    ['user123', platform, tokenData.access_token, tokenData.refresh_token, expiresAt]
  );
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make OAuth Redirect URI: ${getRedirectUri()}`);
});