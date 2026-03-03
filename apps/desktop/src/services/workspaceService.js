const fs = require('fs');
const path = require('path');
const os = require('os');
const { encryptJson, decryptJson, hashContent } = require('./crypto');

function embed(content, dim = 64) {
  const out = Array(dim).fill(0);
  for (let i = 0; i < content.length; i += 1) {
    out[i % dim] += content.charCodeAt(i) / 255;
  }
  const norm = Math.sqrt(out.reduce((acc, n) => acc + n * n, 0)) || 1;
  return out.map((n) => n / norm);
}

function cosine(a, b) {
  return a.reduce((acc, n, i) => acc + n * b[i], 0);
}

class WorkspaceService {
  constructor(secretStore) {
    this.secretStore = secretStore;
    this.basePath = path.join(os.homedir(), '.atio-agent', 'workspaces');
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  async listWorkspaces() {
    return fs.readdirSync(this.basePath, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  }

  workspacePath(name) {
    return path.join(this.basePath, name);
  }

  async createWorkspace(name) {
    fs.mkdirSync(this.workspacePath(name), { recursive: true });
    await this.ensureWorkspaceKey(name);
    await this.writeIndex(name, { docs: [], embeddingVersion: 'local-hash-v1' });
  }

  async deleteWorkspace(name) {
    fs.rmSync(this.workspacePath(name), { recursive: true, force: true });
    await this.secretStore.deleteSecret(`workspace:${name}:key`);
  }

  async ensureWorkspaceKey(name) {
    const account = `workspace:${name}:key`;
    let key = await this.secretStore.getSecret(account);
    if (!key) {
      key = `${Date.now()}-${Math.random()}-${name}`;
      await this.secretStore.setSecret(account, key);
    }
    return key;
  }

  async readIndex(name) {
    const indexPath = path.join(this.workspacePath(name), 'index.enc.json');
    if (!fs.existsSync(indexPath)) return { docs: [], embeddingVersion: 'local-hash-v1' };
    const envelope = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const key = await this.ensureWorkspaceKey(name);
    return decryptJson(envelope, key);
  }

  async writeIndex(name, payload) {
    const key = await this.ensureWorkspaceKey(name);
    const envelope = encryptJson(payload, key);
    const indexPath = path.join(this.workspacePath(name), 'index.enc.json');
    fs.writeFileSync(indexPath, JSON.stringify(envelope, null, 2), 'utf8');
  }

  async addDocument(name, source, content, sensitivity = 'low') {
    const index = await this.readIndex(name);
    const contentHash = hashContent(content);
    const existing = index.docs.find((doc) => doc.contentHash === contentHash);
    if (existing) return existing;
    const doc = {
      id: `doc_${Date.now()}`,
      source,
      sensitivity,
      contentHash,
      contentLength: content.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      embeddingVersion: index.embeddingVersion,
      vector: embed(content)
    };
    index.docs.push(doc);
    await this.writeIndex(name, index);
    return doc;
  }

  async search(name, query, k = 5) {
    const index = await this.readIndex(name);
    const q = embed(query);
    return index.docs
      .map((doc) => ({ ...doc, score: cosine(q, doc.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(({ vector, ...rest }) => rest);
  }

  async backupWorkspace(name, destinationPath) {
    fs.cpSync(this.workspacePath(name), destinationPath, { recursive: true });
  }
}

module.exports = { WorkspaceService };
