const ftp = require('basic-ftp');
import logger from 'electron-log';

let client = new ftp.Client(10000);
let abortRequested = false;

export const abort = async () => {
  abortRequested = true;
  client.close();
};

export const upload = async ({
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
  client = new ftp.Client(10000);
  try {
    logger.debug('before access uploadFtp');
    logger.debug('access server uploadFtp', {
      host,
      port,
      user,
      password,
    });

    port = 2121;

    await client.access({
      host,
      port,
      user,
      password,
    });

    logger.debug('after access uploadFtp');

    client.trackProgress(info => {
      if (progressCallback !== null) {
        progressCallback({
          bytes: info.bytes,
          bytesOverall: info.bytesOverall,
        });
      }
    });

    logger.debug('before uploadFrom');
    logger.debug('localFile uploadFtp', localFile);
    logger.debug('remoteFile uploadFtp', remoteFile);
    await client.uploadFrom(localFile, remoteFile);
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
  client.close();
  client = null;
  return result;
};

export const download = async ({
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
  client = new ftp.Client(10000);
  try {
    logger.debug('before access downloadFtp');
    logger.debug('access server downloadFtp', {
      host,
      port,
      user,
      password,
    });

    port = 2121;

    await client.access({
      host,
      port,
      user,
      password,
    });

    logger.debug('after access downloadFtp');

    logger.debug('localFile downloadFtp', localFile);
    logger.debug('remoteFile downloadFtp', remoteFile);

    const fileInfoList = await client.list(remoteFile);
    if (!fileInfoList || fileInfoList.length === 0) {
      client.close();
      result.success = false;
      result.errors = '파일이 서버에 존재하지 않습니다.';
      return result;
    }

    client.trackProgress(info => {
      if (progressCallback !== null) {
        progressCallback({
          bytes: info.bytes,
          bytesOverall: info.bytesOverall,
        });
      }
    });
    logger.debug('before downloadTo');
    await client.downloadTo(localFile, remoteFile);
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
  client.close();
  client = null;
  return result;
};
