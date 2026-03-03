let keytar;
try {
  keytar = require('keytar');
} catch {
  keytar = null;
}

class SecretStore {
  constructor(serviceName = 'atio-thingworx-agent') {
    this.serviceName = serviceName;
    this.memoryFallback = new Map();
  }

  async setSecret(account, value) {
    if (keytar) {
      await keytar.setPassword(this.serviceName, account, value);
      return;
    }
    this.memoryFallback.set(account, value);
  }

  async getSecret(account) {
    if (keytar) {
      return keytar.getPassword(this.serviceName, account);
    }
    return this.memoryFallback.get(account) || null;
  }

  async deleteSecret(account) {
    if (keytar) {
      await keytar.deletePassword(this.serviceName, account);
      return;
    }
    this.memoryFallback.delete(account);
  }
}

module.exports = { SecretStore };
