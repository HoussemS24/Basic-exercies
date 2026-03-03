const fs = require('fs');
const path = require('path');
const os = require('os');
const Store = require('electron-store');

const defaults = {
  telemetryOptIn: false,
  modelMode: 'local',
  userPreference: 'balanced',
  costCapUsd: 25,
  quotaMonthlyTokens: 1000000,
  enterprisePolicy: {
    enforceSSO: false,
    allowLocalOnly: true,
    telemetryForced: null,
    releaseChannel: 'stable',
    pinnedVersion: null
  }
};

class ConfigService {
  constructor() {
    this.store = new Store({ name: 'user-settings', defaults });
    this.policyPath = process.env.ATIO_POLICY_PATH || path.join(os.homedir(), '.atio-policy.json');
  }

  loadPolicy() {
    if (!fs.existsSync(this.policyPath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.policyPath, 'utf8'));
    } catch {
      return {};
    }
  }

  getMergedConfig() {
    const user = this.store.store;
    const policy = this.loadPolicy();
    return {
      ...defaults,
      ...user,
      enterprisePolicy: {
        ...defaults.enterprisePolicy,
        ...(user.enterprisePolicy || {}),
        ...(policy.enterprisePolicy || {})
      },
      telemetryOptIn: policy.enterprisePolicy?.telemetryForced ?? user.telemetryOptIn
    };
  }

  updateUserConfig(patch) {
    const current = this.store.store;
    this.store.store = {
      ...current,
      ...patch,
      enterprisePolicy: {
        ...(current.enterprisePolicy || {}),
        ...(patch.enterprisePolicy || {})
      }
    };
    return this.getMergedConfig();
  }
}

module.exports = { ConfigService };
