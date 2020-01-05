import { channels } from '../shared/constants';
import { openFile } from './open-file';
import { uploadFtp, downloadFtp } from './transfer';
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
    addedFile.fileSize = fileInfo.size;
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
      logger.debug('upload file', file);
      result = await uploadFtp({
        host,
        port,
        user,
        password,
        localFile: file.filePath,
        remoteFile,
        progressCallback: ({ bytes }) => {
          file.status = 'working';
          file.transferred = bytes;
          event.sender.send(channels.TRANSFER_FILE, file);
        },
      });
    } else {
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
      logger.debug('download file', file);
      result = await downloadFtp({
        host,
        port,
        user,
        password,
        localFile: file.filePath,
        remoteFile,
        progressCallback: ({ bytes }) => {
          file.status = 'working';
          file.transferred = bytes;
          event.sender.send(channels.TRANSFER_FILE, file);
        },
      });
    }

    if (result.success) {
      file.status = 'finished';
    } else {
      file.status = 'error';
      file.errors = result.errors;
    }
    event.sender.send(channels.TRANSFER_FILE, file);
  });
};

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
