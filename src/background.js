'use strict';

const { app, protocol, BrowserWindow, dialog, ipcMain } = require('electron');
const { createProtocol } = 'vue-cli-plugin-electron-builder/lib';
//const Url = 'url-parse';
const logger = require('electron-log');
Object.assign(console, logger.functions);

const { configure } = require('./electron/ipcHandler');

const isDevelopment = process.env.NODE_ENV !== 'production';

const PROTOCOL = 'gemiso.file-manager';

const argv = require('yargs').argv;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

configure({ ipcMain, app, win });

const appLock = app.requestSingleInstanceLock();

if (!appLock) {
  app.quit();
  app.exit();
} else {
  app.on('second-instance', (event, argv, workingDir) => {
    console.log(`second-instance : ${JSON.stringify(argv)}`);
    if (win) {
      win.restore();
      win.focus();
    }
  });
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });
}
let customUrl = '';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  console.log('App started.');
  console.log('process.argv', process.argv);
  console.log('argv', argv);
  console.log('isDevelopment', isDevelopment);
  console.log('process.env.IS_TEST', process.env.IS_TEST);

  const mockArgs = 'gemiso.proxima-fs://?job_id=10';

  if (!isDevelopment && !app.isDefaultProtocolClient(PROTOCOL)) {
    const filePath = app.getPath('exe');
    console.log(`filePath: ${filePath}`);
    app.setAsDefaultProtocolClient(PROTOCOL, filePath);
  }

  createWindow();
});

app.on('open-url', (event, url) => {
  if (app.isReady()) {
    //
  }
  customUrl = url;
  dialog.showMessageBox(null, {
    message: customUrl,
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
