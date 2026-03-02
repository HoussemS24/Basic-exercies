import { app, BrowserWindow, shell } from 'electron';

const create = (): void => {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  win.loadURL('http://localhost:5173');
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};
app.whenReady().then(create);
