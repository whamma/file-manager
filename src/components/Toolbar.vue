<template>
  <div>
    <v-app-bar app>
      <!-- <v-btn v-if="isDevelopment" color="primary" class="mr-4" @click="onTest">
        <span>테스트</span>
      </v-btn>
      <v-btn v-if="isDevelopment" color="primary" class="mr-4" @click="onTest2">
        <span>테스트2</span>
      </v-btn>
      <v-btn v-if="isDevelopment" color="primary" class="mr-4" @click="onTest3">
        <span>테스트3</span>
      </v-btn>-->
      <!-- 시작 버튼 -->
      <v-btn color="success" :disabled="!startable" class="mr-4" @click="onClickStart">
        <v-icon left>mdi-play</v-icon>
        <span>시작</span>
      </v-btn>
      <!-- 중지 버튼 -->
      <v-btn color="error" :disabled="!stopable" @click="onClickStop">
        <v-icon left>mdi-stop</v-icon>
        <span>전송취소</span>
      </v-btn>

      <v-spacer></v-spacer>

      <setting-dialog :disabled="working"></setting-dialog>
      <!-- 개발자도구 활성화 -->
      <v-btn v-if="config && config.isDevelopment" icon @click="onClickInitDevTool">
        <v-icon>mdi-tools</v-icon>
      </v-btn>
    </v-app-bar>
  </div>
</template>

<script>
import { channels } from '@/shared/constants';
import { is404 } from '@/utils/response';
import path from 'path';
import { EventBus } from '@/utils/event-bus';
import SettingDialog from '@/components/SettingDialog';
import sanitize from 'sanitize-filename';
import _ from 'lodash/core';
import { getErrorResponse } from '@/utils/request-error';

let ipcRenderer = null;
if (typeof window.require === 'function') {
  ipcRenderer = window.require('electron').ipcRenderer;
}

export default {
  name: 'toolbar',
  components: {
    SettingDialog,
  },
  created() {
    if (ipcRenderer) {
      this.listenIpcEvents();
    }
    EventBus.$on('open-file', file => {
      if (!ipcRenderer) {
        return;
      }
      console.log('$on.open-file', file);
      ipcRenderer.send(channels.FILE_OPEN, file);
    });

    EventBus.$on('run-file', file => {
      if (!ipcRenderer) {
        return;
      }
      console.log('$on.run-file', file);
      ipcRenderer.send(channels.RUN_FILE, file);
    });

    EventBus.$on('open-folder', file => {
      if (!ipcRenderer) {
        return;
      }
      console.log('$on.open-folder', file);
      ipcRenderer.send(channels.OPEN_FOLDER, file);
    });

    EventBus.$on('retry', file => {
      if (!ipcRenderer) {
        return;
      }
      console.log('$on.retry', file);
      file.status = 'queued';
      this.$store.dispatch('updateFile', file);
      this.onClickStart();
    });
  },
  data() {
    return {
      working: false,
      lastStatusUpdated: null,
      workingFile: null,
    };
  },
  computed: {
    startable() {
      return !this.working && this.selectTransferFile();
    },
    stopable() {
      return this.working;
    },
    config() {
      return this.$store.state.config;
    },
    appVersion() {
      return this.$store.state.config.appVersion;
    },
    os() {
      return this.$store.state.config.os;
    },
    isDevelopment() {
      return this.$store.state.config.isDevelopment;
    },
    downloadDir() {
      return this.$store.state.config.downloadDir;
    },
  },
  methods: {
    handleError(error, file = null) {
      //console.log(error);
      console.log('error.response', error.response);
      console.log('error.code', error.code);
      let message = getErrorResponse(error).message;
      if (error.code === 'ECONNABORTED') {
        message = '서버에 접속할 수 없습니다.';
      }

      if (file) {
        file.status = 'error';
        this.$store.dispatch('updateFile', file);
      }
      this.setAlert({ type: 'error', message });

      throw error;
    },
    warning(message) {
      this.setAlert({ type: 'warning', message });
    },
    success(message) {
      this.setAlert({ type: 'success', message });
    },
    setAlert({ type, message }) {
      this.$emit('alert', {
        type,
        message,
      });
    },
    async getJob(jobId) {
      try {
        const res = await this.$http.get(`/file-server/jobs/${jobId}`);
        return res.data.data;
      } catch (error) {
        console.log('error in getJob', error);
        if (is404(error)) {
          this.handleError(new Error(`작업을 서버에서 찾을 수 없습니다. (${jobId})`));
        } else {
          this.handleError(error);
        }
      }
    },
    listenIpcEvents() {
      // 작업 추가
      ipcRenderer.on(channels.ADD_JOB, async (event, jobInfo) => {
        console.log('event', event);
        console.log('jobInfo', jobInfo);
        if (!jobInfo.jobId) {
          console.log('jobId is empty.');
          return;
        }
        // 1. 서버에서 작업을 조회한 후
        const job = await this.getJob(jobInfo.jobId);
        const file = {
          jobId: job.id,
          type: job.type,
        };
        console.log('job', job);
        let config = this.config;
        console.log('this.config : ', config);

        if (!config) {
          config = {
            downloadDir: jobInfo.downloadDir,
            appVersion: jobInfo.appVersion,
            os: jobInfo.os,
            isDevelopment: jobInfo.isDevelopment,
          };
          console.log('befor setConfig', config);
          this.$store.dispatch('setConfig', config);
        }

        if (job.type === 'download') {
          // 다운로드 작업이면 파일정보를 추가로 입력한다.
          // 제목이 있으면 제목으로
          // 제목이 없으면 file_path에서 파일명을 가져온다.
          let fileName = '';
          if (_.isString(job.title) && !_.isEmpty(job.title)) {
            // 파일 확장자 추출 .이 포함된다.
            const ext = path.extname(job.file_path);
            // 제목을 정제해서 확장자를 붙여준다.
            fileName = sanitize(job.title) + ext;
          } else {
            // 파일 경로에서 파일명만 추출
            fileName = path.basename(job.file_path);
          }

          file.title = job.title;
          file.duration = job.duration;
          file.fileName = fileName;
          file.remoteFileName = job.file_path;
          file.filesize = parseInt(job.filesize);
          file.downloadDir = config.downloadDir;
          file.status = job.status;
        }
        this.$store.dispatch('addFile', file);
        const addedFile = this.findFile(job.id);
        console.log('addedFile', addedFile);

        // 2. 업로드 작업이면 파일 선택 팝업을 띄움.
        if (job.type === 'upload') {
          ipcRenderer.send(channels.FILE_OPEN, addedFile);
        }

        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight);
        }, 500);
      });

      // 파일 열고 난 후
      ipcRenderer.on(channels.FILE_OPEN, (event, file) => {
        console.log('after file open :', file);
        file.status = 'queued';
        this.$store.dispatch('updateFile', file);
      });

      // 파일 전송 시
      ipcRenderer.on(channels.TRANSFER_FILE, async (event, file) => {
        this.workingFile = file;
        file.progress = Math.round((file.transferred / file.filesize) * 100);

        // console.log('before updateFile on TRANSFER_FILE', file);
        this.$store.dispatch('updateFile', file);

        if (file.status === 'finished') {
          await this.updateProgress(file);
          await this.onClickStart();
        } else if (file.status === 'error') {
          this.working = false;
          console.log(file.errors);
          this.handleError(new Error(file.errors), file);
          await this.updateProgress(file);
        } else if (file.status === 'canceled') {
          this.working = false;
          this.warning('전송작업이 취소 되었습니다.');
          await this.updateProgress(file);
        } else {
          await this.updateProgress(file);
        }
      });

      //환경설정 store에 저장
      ipcRenderer.on(channels.SET_CONFIG, (event, config) => {
        this.$store.dispatch('setConfig', config);
        console.log('setConfig', this.config);
      });
    },
    async onTest() {
      //ipcRenderer.send(channels.FILE_OPEN);
      // 업로드 작업 생성
      try {
        const headers = {
          'X-API-USER': 'whamma',
        };
        const job = {
          type: 'upload',
        };
        const res = await this.$http.post('/file-server/jobs', job, { headers });
        console.log(res);
      } catch (error) {
        console.log(error);
        this.handleError(error);
      }
    },
    async onTest2() {
      await this.getJob('321');
    },
    async onTest3() {
      let file = this.$store.state.files[0];
      for (let i = 0; i < 10; i++) {
        file.jobId = 1000 + i;
        console.log(file.jobId);
        this.$store.dispatch('addFile', file);
      }
    },
    onClickInitDevTool() {
      ipcRenderer.send(channels.INIT_DEV_TOOL);
    },
    async onClickStart() {
      this.working = true;
      // 1. 대기중인 파일을 선택
      // 2. 전송작업 할당 api 호출
      // 3. 할당된 서버로 전송
      const selectedFile = this.selectTransferFile();
      if (!selectedFile) {
        this.working = false;
        return;
      }

      if (!selectedFile.jobId) {
        alert('작업아이디가 유효하지 않습니다.');
        this.working = false;
        return;
      }

      console.log('before assignJob', selectedFile);
      const result = await this.assignJob(selectedFile.jobId);
      console.log('after assignJob', result);

      if (!result.success) {
        this.handleError(result.error, selectedFile);
      }

      const { job } = result;

      if (!job.file_server) {
        alert('파일서버 정보가 유효하지 않습니다.');
        return;
      }

      const fileServer = job.file_server;
      const server = {
        host: fileServer.host,
        port: fileServer.port,
        user: fileServer.username,
        password: fileServer.pw,
        remoteDir: fileServer.remote_dir,
      };

      selectedFile.server = server;

      console.log('before send ipc TRANSFER_FILE', selectedFile);
      ipcRenderer.send(channels.TRANSFER_FILE, selectedFile);
    },
    onClickStop() {
      if (!this.working) {
        return;
      }
      ipcRenderer.send(channels.TRANSFER_FILE_ABORT, this.workingFile);
    },
    findFile(jobId) {
      return this.$store.state.files.find(file => file.jobId === jobId);
    },
    selectTransferFile() {
      // 준비완료 된 파일만 전송 가능
      return this.$store.state.files.find(file => file.status === 'queued');
    },
    async assignJob(jobId) {
      //작업 할당 시 client_os, client_ver 제공해야 함
      try {
        const payload = {
          client_ver: this.appVersion,
          client_os: this.os,
        };
        console.log('assignJob payload:', payload);
        const res = await this.$http.post(`/file-server/jobs/${jobId}/assign`, payload);
        console.log('assignJob response:', res);
        return {
          success: true,
          job: res.data.data,
        };
      } catch (error) {
        console.log('error in assignJob', error);
        return {
          success: false,
          error,
        };
      }
    },
    async updateProgress(file) {
      try {
        // 진행중일 땐 5초에 한번씩 업데이트 한다.
        if (file.status === 'working') {
          const now = Date.now();
          if (this.lastStatusUpdated !== null && now - this.lastStatusUpdated < 5000) {
            return;
          }
          this.lastStatusUpdated = now;
        }
        const payload = {
          progress: file.progress,
          status: file.status,
          transferred: file.transferred,
        };

        if (file.type === 'upload') {
          payload.file_path = file.remoteFilePath;
          payload.org_filename = file.fileName;
          payload.filesize = file.filesize;
        }

        const res = await this.$http.post(`/file-server/jobs/${file.jobId}/update-status`, payload);
        console.log('updateProgress response:', res);
      } catch (error) {
        console.log('error in updateProgress', error);
        //this.handleError(error, file);
      }
    },
    retryTransfer() {
      // if (selectedFile.errors !== null) {
      //   selectedFile.errors = null;
      //   selectedFile.progress = 0;
      //   selectedFile.transferred = 0;
      //   selectedFile.status = 'standby';
      //   this.$store.dispatch('updateFile', selectedFile);
      // }
    },
  },
};
</script>

<style lang="scss" scoped></style>
