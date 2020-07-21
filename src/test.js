const SftpClient = require('ssh2-sftp-client');

let sftp = new SftpClient();
sftp
  .connect({
    host: 'send.g.ktv.go.kr',
    port: 2222,
    user: 'upload',
    password: 'xhdqkd!@#$%',
  })
  .then(() => {
    console.log('connected');
    return sftp.get(
      '/download/2020/06/17/20200617_중앙방역대책본부_코로나19_발생현황_정례브리핑_녹취_질의응답_정은경_본부장_YTN_proxy15m1080.mp4',
    );
  })
  .then(chunk => {
    console.log(chunk);
  })
  .catch(err => {
    console.log('catch err:', err);
  });
