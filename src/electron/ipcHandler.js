const { channels } = require('../shared/constants');
const { openFile } = require('./openFile');
const { uploadFtp, client } = require('./transfer');
const logger = require('electron-log');

const path = require('path');
const fs = require('fs');
const util = require('util');
const uuidv4 = require('uuid/v4');

const statPromise = util.promisify(fs.stat);

const configure = ({ ipcMain, app, win }) => {
  /**
   * 업로드 파일 선택
   */
  ipcMain.on(channels.FILE_OPEN, async event => {
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

    event.sender.send(channels.FILE_OPEN, {
      filePath,
      fileSize: fileInfo.size,
      fileName: path.basename(filePath),
    });
  });

  /**
   * 파일 전송
   */
  ipcMain.on(channels.TRANSFER_FILE, async (event, file) => {
    // 전송 작업 시작
    const { host, port, user, password } = file.server;
    const ext = path.extname(file.fileName);
    const basename = path.basename(file.fileName, ext);
    file.destFileName = `${basename}_${uuidv4()}${ext}`;
    const dest = path.join(file.server.path, `${file.destFileName}`).replace(/\\/gi, '/');

    logger.debug('file', file);
    const result = await uploadFtp({
      host,
      port,
      user,
      password,
      src: file.filePath,
      dest,
      progressCallback: ({ bytes, bytesOverall }) => {
        file.status = 'working';
        file.transferred = bytes;
        event.sender.send(channels.TRANSFER_FILE, file);
      },
    });

    if (result.success) {
      file.status = 'done';
    } else {
      file.status = 'error';
      file.errors = result.errors;
    }
    event.sender.send(channels.TRANSFER_FILE, file);
  });
};

module.exports = { configure };
