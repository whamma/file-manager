const ftp = require('basic-ftp');
const logger = require('electron-log');

const client = new ftp.Client(10000);

const uploadFtp = async ({ host, port, user, password, src, dest, progressCallback }) => {
  const result = {
    success: false,
    errors: null,
  };
  try {
    logger.debug('before access');
    await client.access({
      host,
      port,
      user,
      password,
    });

    logger.debug('after access');

    client.trackProgress(info => {
      if (progressCallback !== null) {
        progressCallback({
          bytes: info.bytes,
          bytesOverall: info.bytesOverall,
        });
      }
    });
    logger.debug('before uploadFrom');
    logger.debug('src', src);
    logger.debug('dest', dest);
    await client.uploadFrom(src, dest);
    logger.debug('after uploadFrom');

    result.success = true;
  } catch (error) {
    logger.error('error', error);
    result.success = false;
    result.errors = error;
  }
  client.close();
  return result;
};

module.exports = { uploadFtp, client };
