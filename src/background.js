'use strict';

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
const isDevelopment = process.env.NODE_ENV !== 'production';

import logger from 'electron-log';
Object.assign(console, logger.functions);

import { configure } from './electron/ipc-handler';
import { getQueryParamsFromArgs } from './electron/process-args';
import { channels } from './shared/constants';

const os = require('os');

const PROTOCOL = 'gemiso.file-manager';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let webContentsLoaded = false;

configure({ ipcMain, app, win });

const appLock = app.requestSingleInstanceLock();

if (!appLock) {
  app.quit();
  app.exit();
} else {
  // 앱이 실행되어 있는 상태에서 다시 실행될때
  app.on('second-instance', (event, argv) => {
    console.log(`second-instance : ${JSON.stringify(argv)}`);
    processJob(argv);
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  console.log('App ready.');
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools();
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }

  console.log('process.argv', process.argv);
  console.log('isDevelopment', isDevelopment);
  let args = process.argv;
  if (isDevelopment) {
    // 업로드
    args.push(`${PROTOCOL}://?job_id=321`);
    // 다운로드
    //args.push(`${PROTOCOL}://?job_id=341`);
  }
  console.log('args', args);

  // 기본 프로토콜 설정
  if (!isDevelopment && !app.isDefaultProtocolClient(PROTOCOL)) {
    const filePath = app.getPath('exe');
    console.log(`filePath: ${filePath}`);
    app.setAsDefaultProtocolClient(PROTOCOL, filePath);
  }

  createWindow();

  processJob(args);
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

async function processJob(args) {
  // argv 처리
  const queryParams = getQueryParamsFromArgs(args, PROTOCOL);
  console.log('queryParams', queryParams);
  if (queryParams) {
    const jobId = queryParams['job_id'];
    console.log('webContentsLoaded', webContentsLoaded);
    if (webContentsLoaded) {
      console.log('before send add_job');
      win.webContents.send(channels.ADD_JOB, {
        jobId,
      });
    } else {
      win.webContents.on('did-finish-load', () => {
        webContentsLoaded = true;
        console.log(`Before send add_job.(jobId : ${jobId})`);
        win.webContents.send(channels.ADD_JOB, {
          jobId,
          downloadDir: app.getPath('downloads'),
          appVersion: app.getVersion(),
          os: `${os.platform()}-${os.release()}(${os.arch()})}`,
        });
      });
    }
  } else {
    dialog.showMessageBox(null, {
      message: '작업 정보가 누락되었습니다.',
    });
  }
}
