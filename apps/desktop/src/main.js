const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SecretStore } = require('./services/secretStore');
const { ConfigService } = require('./services/configService');
const { WorkspaceService } = require('./services/workspaceService');
const { MeteringService } = require('./services/meteringService');
const { AuthService } = require('./services/authService');
const { routeModel } = require('./services/routerService');
const { TelemetryService } = require('./services/telemetryService');
const { UpdaterService } = require('./services/updaterService');

const secretStore = new SecretStore();
const configService = new ConfigService();
const workspaceService = new WorkspaceService(secretStore);
const meteringService = new MeteringService(secretStore);
const authService = new AuthService(secretStore);
const telemetryService = new TelemetryService(configService);
const updaterService = new UpdaterService();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
}

app.whenReady().then(async () => {
  await authService.loadSession();
  createWindow();
});

ipcMain.handle('config:get', () => configService.getMergedConfig());
ipcMain.handle('config:update', (_, patch) => configService.updateUserConfig(patch));
ipcMain.handle('auth:state', () => authService.getAuthState());
ipcMain.handle('auth:login', async () => authService.login());
ipcMain.handle('auth:logout', async () => authService.logout());
ipcMain.handle('workspace:list', async () => workspaceService.listWorkspaces());
ipcMain.handle('workspace:create', async (_, name) => workspaceService.createWorkspace(name));
ipcMain.handle('workspace:delete', async (_, name) => workspaceService.deleteWorkspace(name));
ipcMain.handle('rag:addDocument', async (_, payload) => workspaceService.addDocument(payload.workspace, payload.source, payload.content, payload.sensitivity));
ipcMain.handle('rag:search', async (_, payload) => workspaceService.search(payload.workspace, payload.query, payload.k || 5));
ipcMain.handle('router:decide', async (_, input) => routeModel(input));
ipcMain.handle('metering:append', async (_, record) => meteringService.appendRecord(record));
ipcMain.handle('metering:verify', async () => meteringService.verifyLedger());
ipcMain.handle('metering:reconcile', async () => meteringService.reconcile());
ipcMain.handle('telemetry:track', async (_, eventName, attrs) => telemetryService.track(eventName, attrs));
ipcMain.handle('update:check', async (_, channel) => updaterService.checkForUpdates(channel));
