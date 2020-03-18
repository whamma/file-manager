const SftpClient = require('ssh2-sftp-client');
import logger from 'electron-log';
import fs from 'fs';

let sftp = new SftpClient();
let abortRequested = false;

export const abort = async () => {
  abortRequested = true;
  sftp.end();
};

export const uploadFtp = async ({
  host,
  port,
  user,
  password,
  localFile,
  remoteFile,
  progressCallback,
}) => {
  const result = {
    success: false,
    aborted: false,
    errors: null,
  };
  abortRequested = false;
  sftp = new SftpClient();
  try {
    host = '192.168.142.1';
    port = 2222;

    logger.debug('before access uploadFtp');
    logger.debug('access server uploadFtp', {
      host,
      port,
      user,
    });

    await sftp.connect({
      host,
      port,
      username: user,
      password,
    });

    logger.debug('after access uploadFtp');

    // sftp.on('upload', info => {
    //   console.log('info', info.source);
    //   if (progressCallback !== null) {
    //     // progressCallback({
    //     //   bytes: info.bytes,
    //     //   bytesOverall: info.bytesOverall,
    //     // });
    //   }
    // });

    logger.debug('before uploadFrom');
    logger.debug('localFile uploadFtp', localFile);
    logger.debug('remoteFile uploadFtp', remoteFile);
    const localFileStream = fs.createReadStream(localFile);
    let bytesOverall = 0;
    let lastUpdatedAt = new Date();
    localFileStream.on('data', chunk => {
      if (progressCallback !== null) {
        bytesOverall += chunk.length;
        if (new Date() - lastUpdatedAt > 200) {
          progressCallback({
            bytes: bytesOverall,
            bytesOverall,
          });
          lastUpdatedAt = new Date();
        }
      }
    });

    localFileStream.on('end', () => {
      if (progressCallback !== null) {
        progressCallback({
          bytes: bytesOverall,
          bytesOverall,
        });
      }
    });

    await sftp.put(localFileStream, remoteFile);
    logger.debug('after uploadFrom');

    result.success = true;
  } catch (error) {
    if (abortRequested) {
      result.success = false;
      result.aborted = true;
      return result;
    } else {
      logger.error('error uploadFtp', error);
      logger.error('error.message uploadFtp', error.message);
      result.success = false;
      result.errors = error.message;
    }
  }
  sftp.end();
  sftp = null;
  return result;
};

export const downloadFtp = async ({
  host,
  port,
  user,
  password,
  localFile,
  remoteFile,
  progressCallback,
}) => {
  const result = {
    success: false,
    aborted: false,
    errors: null,
  };
  abortRequested = false;
  sftp = new SftpClient(10000);
  try {
    host = '192.168.142.1';
    port = 2222;

    logger.debug('before access downloadFtp');
    logger.debug('access server downloadFtp', {
      host,
      port,
      user,
    });

    await sftp.connect({
      host,
      port,
      username: user,
      password,
    });

    logger.debug('after access downloadFtp');

    logger.debug('localFile downloadFtp', localFile);
    logger.debug('remoteFile downloadFtp', remoteFile);

    const remoteFileExists = await sftp.exists(remoteFile);
    if (!remoteFileExists) {
      sftp.close();
      result.success = false;
      result.errors = '파일이 서버에 존재하지 않습니다.';
      return result;
    }

    let bytesOverall = 0;
    let lastUpdatedAt = new Date();
    await sftp.fastGet(remoteFile, localFile, {
      step: (bytesOverall, chunk, totalSize) => {
        if (progressCallback !== null) {
          if (new Date() - lastUpdatedAt > 200 || bytesOverall === totalSize) {
            progressCallback({
              bytes: bytesOverall,
              bytesOverall,
            });
            lastUpdatedAt = new Date();
          }
        }
      },
    });
    logger.debug('after downloadTo');

    result.success = true;
  } catch (error) {
    if (abortRequested) {
      result.success = false;
      result.aborted = true;
      return result;
    } else {
      logger.error('error downloadFtp', error);
      logger.error('error.message downloadFtp', error.message);
      result.success = false;
      result.errors = error.message;
    }
  }
  sftp.end();
  sftp = null;
  return result;
};
