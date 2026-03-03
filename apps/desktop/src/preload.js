const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentApi', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (patch) => ipcRenderer.invoke('config:update', patch),
  authState: () => ipcRenderer.invoke('auth:state'),
  login: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  listWorkspaces: () => ipcRenderer.invoke('workspace:list'),
  createWorkspace: (name) => ipcRenderer.invoke('workspace:create', name),
  deleteWorkspace: (name) => ipcRenderer.invoke('workspace:delete', name),
  addDocument: (payload) => ipcRenderer.invoke('rag:addDocument', payload),
  search: (payload) => ipcRenderer.invoke('rag:search', payload),
  route: (input) => ipcRenderer.invoke('router:decide', input),
  appendUsage: (record) => ipcRenderer.invoke('metering:append', record),
  verifyLedger: () => ipcRenderer.invoke('metering:verify'),
  reconcile: () => ipcRenderer.invoke('metering:reconcile'),
  telemetryTrack: (eventName, attrs) => ipcRenderer.invoke('telemetry:track', eventName, attrs),
  checkUpdates: (channel) => ipcRenderer.invoke('update:check', channel)
});
