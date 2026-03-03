const test = require('node:test');
const assert = require('node:assert/strict');
const { routeModel } = require('../src/services/routerService');
const { encryptJson, decryptJson } = require('../src/services/crypto');

test('router deterministic offline local', () => {
  const input = {
    offline: true,
    sensitivity: 'low',
    enterprisePolicy: { allowLocalOnly: false },
    userPreference: 'cloud-first',
    quotaRemaining: 100,
    costCapReached: false
  };
  const a = routeModel(input);
  const b = routeModel(input);
  assert.equal(a.provider, 'local');
  assert.deepEqual(a, b);
});

test('crypto round trip', () => {
  const payload = { hello: 'world', n: 1 };
  const enc = encryptJson(payload, 'secret-material');
  const dec = decryptJson(enc, 'secret-material');
  assert.deepEqual(dec, payload);
});
