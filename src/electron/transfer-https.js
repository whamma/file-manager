const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
import logger from 'electron-log';

let abortRequested = false;
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export const abort = async () => {
  abortRequested = true;
  source.cancel();
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
  try {
    logger.debug('before upload');
    const opt = {
      host,
      port,
      user,
      password,
    };
    logger.debug('upload', {
      host: opt.host,
    });

    logger.debug('localFile uploadFtp', localFile);
    logger.debug('remoteFile uploadFtp', remoteFile);
    let form = new FormData();
    form.append('file', fs.createReadStream(localFile), {
      filename: remoteFile,
    });

    await axios
      .create({
        headers: form.getHeaders(),
      })
      .post(`https://send.g.ktv.go.kr/upload`, form, {
        onUploadProgress: progressEvent => {
          if (progressCallback !== null) {
            progressCallback({
              bytes: progressEvent.loaded,
              bytesOverall: progressEvent.total,
            });
          }
        },
      });
    logger.debug('after upload');

    result.success = true;
  } catch (error) {
    if (abortRequested) {
      result.success = false;
      result.aborted = true;
      return result;
    } else {
      logger.error('error upload', error);
      logger.error('error.message upload', error.message);
      result.success = false;
      result.errors = error.message;
    }
  }
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
  try {
    logger.debug('before download');
    const opt = {
      host,
      port,
      user,
      password,
    };
    logger.debug('download', {
      host: opt.host,
    });

    logger.debug('after access download');

    remoteFile = remoteFile.replace(/download/gi, '');
    remoteFile = encodeURI(remoteFile.replace(/\/\//gi, ''));
    const url = `https://send.g.ktv.go.kr/download?path=CMS/${remoteFile}`;
    logger.debug('localFile download', localFile);
    logger.debug('url', url);
    logger.debug('remoteFile download', remoteFile);

    const writer = fs.createWriteStream(localFile);
    let lastUpdatedAt = new Date();
    let bytesOverall = 0;
    https.get(url, res => {
      res.on('data', chunk => {
        if (progressCallback !== null) {
          bytesOverall += chunk.length;
          if (new Date() - lastUpdatedAt > 200) {
            progressCallback({
              bytes: bytesOverall,
            });
            lastUpdatedAt = new Date();
          }
        }
      });
      res.pipe(writer);
    });
    /*
    logger.debug('Connecting...');
    const { data, headers } = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });
    logger.debug('Connected. headers : ', headers);
    const totalSize = headers['content-length'];
    logger.debug('Starting download...');
    const writer = fs.createWriteStream(localFile);

    let lastUpdatedAt = new Date();
    let bytesOverall = 0;
    data.on('data', chunk => {
      if (progressCallback !== null) {
        bytesOverall += chunk.length;
        if (new Date() - lastUpdatedAt > 200 || bytesOverall === totalSize) {
          progressCallback({
            bytes: bytesOverall,
          });
          lastUpdatedAt = new Date();
        }
      }
    });
    data.pipe(writer);
*/
    const waitData = new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.debug('writer event finished.');
        if (progressCallback !== null) {
          progressCallback({
            bytes: bytesOverall,
          });
        }
        resolve();
      });
      writer.on('error', () => {
        logger.debug('writer event error.');
        reject();
      });
    });

    await waitData;

    logger.debug('after download');

    result.success = true;
  } catch (error) {
    if (abortRequested) {
      result.success = false;
      result.aborted = true;
      return result;
    } else {
      logger.error('error download', error);
      logger.error('error.message download', error.message);
      result.success = false;
      result.errors = error.message;
    }
  }
  return result;
};
