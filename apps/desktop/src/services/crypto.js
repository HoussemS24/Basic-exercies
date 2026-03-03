const crypto = require('crypto');

function deriveKey(material) {
  return crypto.createHash('sha256').update(material).digest();
}

function encryptJson(payload, keyMaterial) {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(keyMaterial);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64')
  };
}

function decryptJson(envelope, keyMaterial) {
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const encrypted = Buffer.from(envelope.data, 'base64');
  const key = deriveKey(keyMaterial);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

module.exports = { encryptJson, decryptJson, hashContent };
