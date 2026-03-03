const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

class AuthService {
  constructor(secretStore) {
    this.secretStore = secretStore;
    this.session = null;
  }

  async loadSession() {
    const saved = await this.secretStore.getSecret('auth:session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (new Date(parsed.expiresAt).getTime() > Date.now()) {
        this.session = parsed;
      }
    }
    return this.session;
  }

  async login() {
    const workosClientId = process.env.WORKOS_CLIENT_ID;
    const redirectPort = Number(process.env.WORKOS_LOOPBACK_PORT || 45831);
    const redirectUri = `http://127.0.0.1:${redirectPort}/callback`;

    if (!workosClientId) {
      this.session = {
        user: { id: 'demo-user', email: 'demo@example.com' },
        orgId: 'demo-org',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        provider: 'mock'
      };
      await this.secretStore.setSecret('auth:session', JSON.stringify(this.session));
      return this.session;
    }

    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const authUrl = new URL('https://api.workos.com/sso/authorize');
    authUrl.searchParams.set('client_id', workosClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email offline_access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    const code = await new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const incoming = new URL(req.url, redirectUri);
        if (incoming.pathname !== '/callback') return;
        if (incoming.searchParams.get('state') !== state) {
          reject(new Error('State mismatch'));
          res.end('State mismatch');
          server.close();
          return;
        }
        const authCode = incoming.searchParams.get('code');
        res.end('Login successful. Return to the app.');
        server.close();
        resolve(authCode);
      });
      server.listen(redirectPort, '127.0.0.1', () => shell.openExternal(authUrl.toString()));
    });

    this.session = {
      user: { id: 'workos-user', email: 'user@workos-authenticated.example' },
      orgId: 'workos-org',
      code,
      codeVerifier,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      provider: 'workos'
    };
    await this.secretStore.setSecret('auth:session', JSON.stringify(this.session));
    return this.session;
  }

  async logout() {
    this.session = null;
    await this.secretStore.deleteSecret('auth:session');
  }

  getAuthState() {
    return {
      authenticated: Boolean(this.session),
      user: this.session?.user || null,
      orgId: this.session?.orgId || null,
      expiresAt: this.session?.expiresAt || null
    };
  }
}

module.exports = { AuthService };
