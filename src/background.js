'use strict';

import { app, protocol, BrowserWindow, ipcMain } from 'electron';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
const isDevelopment = process.env.NODE_ENV !== 'production';

import logger from 'electron-log';
Object.assign(console, logger.functions);

import { configure } from './electron/ipc-handler';
import {
  getQueryParamsFromArgs,
  containedProtocolArg,
  replaceProtocolArg,
} from './electron/process-args';
import { channels } from './shared/constants';
import { loadDownloadDir, loadIsDevelopment } from './electron/config';
import debug from 'electron-debug';

debug();

const os = require('os');

const PROTOCOL = 'gemiso.file-manager';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let webContentsLoaded = false;

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

  win.setMenu(null);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) {
      //win.webContents.openDevTools();
    }
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });

  configure({ ipcMain, app, win });
}

app.on('open-url', (event, url) => {
  console.log('open-url url : ', url);

  /**
   * 앱이 실행중이 아니면 process.argv에만 url을 추가 해준다.
   */
  if (!app.isReady()) {
    process.argv.push(url);
    return;

    // if(!containedProtocolArg(process.argv, PROTOCOL)) {
    //   process.argv.push(url);
    // } else {
    //   process.argv = replaceProtocolArg(process.argv, PROTOCOL, url);
    // }
    // return;
  }

  let args = [url];

  console.log('open-url process.argv', process.argv);
  console.log('open-url args', args);

  if (win) {
    console.log('win exists');
    processJob(args);
    win.restore();
    win.focus();
  } else {
    console.log('win does not exists');
    webContentsLoaded = false;
    createWindow();

    processJob(args);
  }
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

  // console.log('app data path', app.getPath('userData'));

  console.log('process.argv', process.argv);
  console.log('isDevelopment', isDevelopment);
  let args = process.argv;
  if (isDevelopment && containedProtocolArg(args, PROTOCOL)) {
    // 업로드
    // args.push(`${PROTOCOL}://?job_id=321`);
    // 다운로드
    //args.push(`${PROTOCOL}://?job_id=2145`);
  }
  args.push(`${PROTOCOL}://?job_id=2145`);

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
        downloadDir: loadDownloadDir() || app.getPath('downloads'),
        appVersion: app.getVersion(),
        os: `${os.platform()}-${os.release()}(${os.arch()})`,
        isDevelopment: isDevelopment || loadIsDevelopment(),
      });
    } else {
      win.webContents.on('did-finish-load', () => {
        webContentsLoaded = true;

        const appTitle = require('../package.json').appTitle;
        const appVersion = require('../package.json').version;
        const windowTitle = `${appTitle} ${appVersion}`;

        win.setTitle(windowTitle);

        console.log(`Before send add_job.(jobId : ${jobId})`);
        const job = {
          jobId,
          downloadDir: loadDownloadDir() || app.getPath('downloads'),
          appVersion: app.getVersion(),
          os: `${os.platform()}-${os.release()}(${os.arch()})`,
          isDevelopment: isDevelopment || loadIsDevelopment(),
        };
        console.log(`job is ${JSON.stringify(job)}`);
        win.webContents.send(channels.ADD_JOB, job);
        console.log('After send add_job.(jobId : ${jobId})');
      });
    }
  } else {
    console.log('queryParams is empty.');
    if (webContentsLoaded) {
      win.webContents.send(channels.SET_CONFIG, {
        downloadDir: loadDownloadDir() || app.getPath('downloads'),
        appVersion: app.getVersion(),
        os: `${os.platform()}-${os.release()}(${os.arch()})`,
        isDevelopment: isDevelopment || loadIsDevelopment(),
      });
    } else {
      win.webContents.on('did-finish-load', () => {
        webContentsLoaded = true;

        const appTitle = require('../package.json').appTitle;
        const appVersion = require('../package.json').version;
        const windowTitle = `${appTitle} ${appVersion}`;

        win.setTitle(windowTitle);

        win.webContents.send(channels.SET_CONFIG, {
          downloadDir: loadDownloadDir() || app.getPath('downloads'),
          appVersion: app.getVersion(),
          os: `${os.platform()}-${os.release()}(${os.arch()})`,
          isDevelopment: isDevelopment || loadIsDevelopment(),
        });
      });
    }
  }
}
