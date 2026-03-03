/* global agentApi */
let currentWorkspace = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.querySelectorAll('[data-nav]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.nav));
});

async function refreshAuth() {
  const state = await agentApi.authState();
  document.getElementById('authState').textContent = state.authenticated ? `Signed in: ${state.user.email}` : 'Signed out';
  document.getElementById('loginState').textContent = JSON.stringify(state, null, 2);
}

async function refreshWorkspaces() {
  const list = await agentApi.listWorkspaces();
  const ul = document.getElementById('workspaceList');
  ul.innerHTML = '';
  list.forEach((name) => {
    const li = document.createElement('li');
    const select = document.createElement('button');
    select.textContent = `Select ${name}`;
    select.addEventListener('click', () => {
      currentWorkspace = name;
      agentApi.telemetryTrack('workspace_selected', { workspace: name });
    });
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      await agentApi.deleteWorkspace(name);
      await refreshWorkspaces();
    });
    li.textContent = `${name} `;
    li.appendChild(select);
    li.appendChild(del);
    ul.appendChild(li);
  });
  if (!currentWorkspace && list.length) currentWorkspace = list[0];
}

window.addEventListener('DOMContentLoaded', async () => {
  const config = await agentApi.getConfig();
  document.getElementById('telemetryOptIn').checked = config.telemetryOptIn;
  document.getElementById('modelMode').value = config.modelMode;
  document.getElementById('userPreference').value = config.userPreference;
  document.getElementById('costCap').value = config.costCapUsd;
  await refreshAuth();
  await refreshWorkspaces();

  document.getElementById('saveWizard').addEventListener('click', async () => {
    await agentApi.updateConfig({
      telemetryOptIn: document.getElementById('telemetryOptIn').checked,
      modelMode: document.getElementById('modelMode').value
    });
    await agentApi.createWorkspace('default');
    document.getElementById('wizardStatus').textContent = 'Initialized default workspace.';
  });

  document.getElementById('loginBtn').addEventListener('click', async () => {
    await agentApi.login();
    await refreshAuth();
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await agentApi.logout();
    await refreshAuth();
  });

  document.getElementById('createWorkspaceBtn').addEventListener('click', async () => {
    const name = document.getElementById('workspaceName').value.trim();
    if (!name) return;
    await agentApi.createWorkspace(name);
    currentWorkspace = name;
    await refreshWorkspaces();
  });

  document.getElementById('addDocBtn').addEventListener('click', async () => {
    if (!currentWorkspace) return;
    await agentApi.addDocument({
      workspace: currentWorkspace,
      source: document.getElementById('docSource').value || 'manual',
      content: document.getElementById('docContent').value,
      sensitivity: 'low'
    });
    document.getElementById('searchResults').textContent = 'Document added';
  });

  document.getElementById('searchBtn').addEventListener('click', async () => {
    if (!currentWorkspace) return;
    const data = await agentApi.search({ workspace: currentWorkspace, query: document.getElementById('searchQuery').value, k: 3 });
    document.getElementById('searchResults').textContent = JSON.stringify(data, null, 2);
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    await agentApi.updateConfig({ userPreference: document.getElementById('userPreference').value, costCapUsd: Number(document.getElementById('costCap').value) });
  });

  document.getElementById('routeSampleBtn').addEventListener('click', async () => {
    const configNow = await agentApi.getConfig();
    const decision = await agentApi.route({
      offline: false,
      sensitivity: 'medium',
      enterprisePolicy: configNow.enterprisePolicy,
      userPreference: configNow.userPreference,
      quotaRemaining: 5000,
      costCapReached: false
    });
    document.getElementById('routeOutput').textContent = JSON.stringify(decision, null, 2);
  });

  document.getElementById('recordUsageBtn').addEventListener('click', async () => {
    const item = await agentApi.appendUsage({
      orgId: 'demo-org',
      tenantId: 'demo-tenant',
      userId: 'demo-user',
      deviceId: 'local-device',
      workspaceId: currentWorkspace || 'none',
      operation: 'completion',
      provider: 'local',
      model: 'qwen3-coder',
      promptTokens: 123,
      outputTokens: 45,
      latencyMs: 512,
      costUnits: 0.1
    });
    document.getElementById('usageOutput').textContent = JSON.stringify(item, null, 2);
  });

  document.getElementById('verifyLedgerBtn').addEventListener('click', async () => {
    const result = await agentApi.verifyLedger();
    document.getElementById('usageOutput').textContent = JSON.stringify(result, null, 2);
  });

  document.getElementById('reconcileBtn').addEventListener('click', async () => {
    const result = await agentApi.reconcile();
    document.getElementById('usageOutput').textContent = JSON.stringify(result, null, 2);
  });
});
