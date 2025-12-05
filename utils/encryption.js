const crypto = require('crypto');

class EncryptionUtil {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  // Generate a random key if not provided
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  // Encrypt a message
  encrypt(text) {
    try {
      if (!text) return text;
      
      const key = Buffer.from(this.secretKey, 'hex').slice(0, this.keyLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Return iv + tag + encrypted message
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Return original text if encryption fails
    }
  }

  // Decrypt a message
  decrypt(encryptedText) {
    try {
      if (!encryptedText || !encryptedText.includes(':')) {
        return encryptedText; // Return as-is if not encrypted format
      }
      
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        return encryptedText; // Return as-is if not proper format
      }
      
      const key = Buffer.from(this.secretKey, 'hex').slice(0, this.keyLength);
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Return encrypted text if decryption fails
    }
  }

  // Check if text is encrypted
  isEncrypted(text) {
    return text && typeof text === 'string' && text.includes(':') && text.split(':').length === 3;
  }
}

// Create singleton instance
const encryptionUtil = new EncryptionUtil();

module.exports = encryptionUtil;
