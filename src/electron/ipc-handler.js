import { channels } from '../shared/constants';
import { openFile, openDirectory } from './open-dialogs';
import { upload, download, abort } from './transfer-ftp';
import { saveDownloadDir } from './config';
import { shell } from 'electron';

import logger from 'electron-log';
import path from 'path';
import fs from 'fs';
import util from 'util';
import uuidv4 from 'uuid/v4';

const statPromise = util.promisify(fs.stat);

export const configure = ({ ipcMain, app, win }) => {
  /**
   * 업로드 파일 선택
   */
  ipcMain.on(channels.FILE_OPEN, async (event, addedFile) => {
    const result = await openFile({
      ownerWin: win,
      defaultPath: app.getPath('documents'),
    });
    if (result.canceled) {
      return;
    }
    const filePath = result.filePaths[0];
    // 파일 정보 구하기
    const fileInfo = await statPromise(filePath);
    addedFile.filePath = filePath;
    addedFile.filesize = fileInfo.size;
    addedFile.fileName = path.basename(filePath);
    event.sender.send(channels.FILE_OPEN, addedFile);
  });
  /**
   * 파일 전송
   */
  ipcMain.on(channels.TRANSFER_FILE, async (event, file) => {
    // 전송 작업 시작
    const { host, port, user, password } = file.server;
    let result = null;
    if (file.type === 'upload') {
      const ext = path.extname(file.fileName);
      const basename = path.basename(file.fileName, ext);
      file.remoteFileName = `${basename}_${uuidv4()}${ext}`;
      let remoteFile = '';
      if (file.server.remoteDir) {
        remoteFile = path
          .join(file.server.remoteDir, `${file.remoteFileName}`)
          .replace(/\\/gi, '/');
      } else {
        remoteFile = file.remoteFileName;
      }
      file.remoteFilePath = remoteFile;
      logger.debug('upload file', makeFileObjForLogging(file));
      result = await upload({
        host,
        port,
        user,
        password,
        localFile: file.filePath,
        remoteFile,
        progressCallback: ({ bytes }) => {
          if (file.status !== 'working') {
            file.status = 'working';
            file.startedAt = Date.now();
          }
          file.transferred = bytes;
          event.sender.send(channels.TRANSFER_FILE, file);
        },
      });
    } else {
      // download
      let remoteFile = '';
      if (file.server.remoteDir) {
        remoteFile = path
          .join(file.server.remoteDir, `${file.remoteFileName}`)
          .replace(/\\/gi, '/');
      } else {
        remoteFile = file.remoteFileName;
      }
      if (!file.filePath) {
        let localFile = path.join(file.downloadDir, `${file.fileName}`).replace(/\\/gi, '/');
        file.filePath = localFile;
      }
      logger.debug('download file', makeFileObjForLogging(file));
      result = await download({
        host,
        port,
        user,
        password,
        localFile: file.filePath,
        remoteFile,
        progressCallback: ({ bytes }) => {
          if (file.status !== 'working') {
            file.status = 'working';
            file.startedAt = Date.now();
          }
          file.transferred = bytes;
          event.sender.send(channels.TRANSFER_FILE, file);
        },
      });
    }

    console.log('transfer finished', makeFileObjForLogging(file));
    console.log('FTP result', result);

    if (result.success) {
      file.status = 'finished';
    } else if (result.aborted) {
      file.status = 'canceled';
    } else {
      file.status = 'error';
      file.errors = result.errors;
    }

    console.log('channels.TRANSFER_FILE', makeFileObjForLogging(file));
    event.sender.send(channels.TRANSFER_FILE, file);
  });

  /**
   * 다운로드 디렉터리 선택
   */
  ipcMain.on(channels.DIR_OPEN, async (event, directory) => {
    if (!directory || directory == '') {
      directory = app.getPath('downloads');
    }
    const result = await openDirectory({
      ownerWin: win,
      defaultPath: directory,
    });
    if (result.canceled) {
      return;
    }
    console.log(result);
    const selectedDir = result.filePaths[0];
    event.sender.send(channels.DIR_OPEN, selectedDir);
  });

  ipcMain.on(channels.SAVE_CONFIG, (event, config) => {
    saveDownloadDir(config.downloadDir);
  });

  ipcMain.on(channels.TRANSFER_FILE_ABORT, async (event, file) => {
    try {
      const result = await abort();
      if (result && result.aborted) {
        file.status = 'canceled';
        console.log('channels.TRANSFER_FILE_ABORT', makeFileObjForLogging(file));
        event.sender.send(channels.TRANSFER_FILE, file);
      }
    } catch (error) {
      console.log('trasnfer file abort exception:', error);
    }
  });

  ipcMain.on(channels.RUN_FILE, async (event, file) => {
    await shell.openItem(file.filePath);
  });

  ipcMain.on(channels.OPEN_FOLDER, async (event, file) => {
    await shell.showItemInFolder(file.filePath);
  });

  /**
   * 개발자 도구 활성화
   */
  ipcMain.on(channels.INIT_DEV_TOOL, () => {
    win.webContents.openDevTools();
  });
};

/**
 *
 * @param {object} file 로그를 쓸때 사용하기위한 업로드/다운로드 서버 사용자 아이디와 비밀번호를 제거한 파일 객체를 반환
 */
function makeFileObjForLogging(file) {
  return {
    ...file,
    server: {
      ...file.server,
      username: null,
      pw: null,
    },
  };
}

export const selectFile = async ({ win }) => {
  const result = await openFile({
    ownerWin: win,
  });
  if (result.canceled) {
    return;
  }
  const filePath = result.filePaths[0];
  // 파일 정보 구하기
  const fileInfo = await statPromise(filePath);

  fileInfo.filePath = filePath;
  fileInfo.fileName = path.basename(filePath);

  return fileInfo;
};
