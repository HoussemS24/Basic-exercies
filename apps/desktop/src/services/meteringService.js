const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class MeteringService {
  constructor(secretStore) {
    this.secretStore = secretStore;
    this.dataDir = path.join(os.homedir(), '.atio-agent', 'metering');
    this.ledgerPath = path.join(this.dataDir, 'ledger.jsonl');
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  async key() {
    const account = 'metering:signingKey';
    let value = await this.secretStore.getSecret(account);
    if (!value) {
      value = crypto.randomBytes(32).toString('hex');
      await this.secretStore.setSecret(account, value);
    }
    return value;
  }

  async appendRecord(record) {
    const key = await this.key();
    const prev = this.readRecords().at(-1);
    const counter = (prev?.counter || 0) + 1;
    const payload = {
      ...record,
      counter,
      ts: new Date().toISOString(),
      idempotencyKey: `${record.orgId}-${record.userId}-${counter}`,
      prevHash: prev?.hash || null
    };
    const hash = crypto.createHmac('sha256', key).update(JSON.stringify(payload)).digest('hex');
    const final = { ...payload, hash };
    fs.appendFileSync(this.ledgerPath, `${JSON.stringify(final)}\n`, 'utf8');
    return final;
  }

  readRecords() {
    if (!fs.existsSync(this.ledgerPath)) return [];
    return fs.readFileSync(this.ledgerPath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
  }

  async verifyLedger() {
    const key = await this.key();
    const records = this.readRecords();
    let prevHash = null;
    for (const record of records) {
      const { hash, ...payload } = record;
      if (payload.prevHash !== prevHash) return { ok: false, reason: 'hash_chain_broken' };
      const expected = crypto.createHmac('sha256', key).update(JSON.stringify(payload)).digest('hex');
      if (expected !== hash) return { ok: false, reason: 'signature_invalid' };
      prevHash = hash;
    }
    return { ok: true, count: records.length };
  }

  async reconcile() {
    const verification = await this.verifyLedger();
    if (!verification.ok) return { sent: 0, status: 'blocked', reason: verification.reason };
    const records = this.readRecords();
    const unsent = records.filter((r) => !r.reconciledAt);
    const now = new Date().toISOString();
    const updated = records.map((r) => (r.reconciledAt ? r : { ...r, reconciledAt: now }));
    if (updated.length) {
      fs.writeFileSync(this.ledgerPath, `${updated.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
    }
    return { sent: unsent.length, status: 'ok' };
  }
}

module.exports = { MeteringService };
