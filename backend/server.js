import express from 'express';
import prisma from './prisma.js';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32-byte
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}


app.post('/api/keys', async (req, res) => {
  const { email, platform, key } = req.body;


  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  const encryptedKey = encrypt(key);

  const saved = await prisma.streamKey.create({
    data: {
      platform,
      key: encryptedKey,
      userId: user.id,
    },
  });

  res.json({ success: true, id: saved.id });
});


app.get('/api/keys', async (req, res) => {
  const { email } = req.query;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { streamKeys: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const keys = user.streamKeys.map((k) => ({
    id: k.id,
    platform: k.platform,
    partial: decrypt(k.key).slice(0, 4) + '...' + decrypt(k.key).slice(-4),
    full: decrypt(k.key),
  }));

  res.json(keys);
});

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Backend server is running on PORT ${PORT}`)
})