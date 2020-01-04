<template>
  <v-toolbar>
    <!-- 테스트 버튼 -->
    <v-btn color="primary" class="mr-4" @click="onClickUpload">
      <v-icon left>mdi-file-upload</v-icon>
      <span>테스트</span>
    </v-btn>
    <!-- 시작 버튼 -->
    <v-btn color="success" :disabled="startable" @click="onClickStart">
      <v-icon left>mdi-play</v-icon>
      <span>시작</span>
    </v-btn>
  </v-toolbar>
</template>

<script>
import { channels } from '@/shared/constants';

let ipcRenderer = null;
if (typeof window.require === 'function') {
  ipcRenderer = window.require('electron').ipcRenderer;
}

export default {
  name: 'toolbar',
  created() {
    if (ipcRenderer) {
      this.listenIpcEvents();
    }
  },
  data() {
    return {
      working: false,
    };
  },
  computed: {
    startable() {
      return this.working || !this.selectTransferFile();
    },
  },
  methods: {
    listenIpcEvents() {
      // 파일 열고 난 후
      ipcRenderer.on(channels.FILE_OPEN, (event, file) => {
        file.type = 'upload';
        this.$store.dispatch('addFile', file);
      });

      // 파일 전송 시
      ipcRenderer.on(channels.TRANSFER_FILE, (event, file) => {
        file.progress = Math.round((file.transferred / file.fileSize) * 100);
        this.$store.dispatch('updateFile', file);

        if (file.status === 'done') {
          this.onClickStart();
        } else if (file.status === 'error') {
          console.log(file.errors);
        }
      });
    },
    async onClickUpload() {
      //ipcRenderer.send(channels.FILE_OPEN);
      // 업로드 작업 생성
      try {
        const headers = {
          'X-API-USER': 'whamma',
        };
        const job = {
          type: 'upload',
        };
        const res = await this.$axios.post('/file-server/jobs', job, { headers });
        console.log(res);
      } catch (error) {
        console.log(error);
      }
    },
    onClickStart() {
      this.working = true;
      const selectedFile = this.selectTransferFile();
      if (!selectedFile) {
        this.working = false;
        return;
      }

      const server = {
        host: '192.168.142.1',
        port: 2121,
        user: 'upload',
        password: 'xhdqkd!@#$%',
        path: '/upload',
      };

      selectedFile.server = server;

      ipcRenderer.send(channels.TRANSFER_FILE, selectedFile);
    },
    selectTransferFile() {
      return this.$store.state.files.find(file => file.status === 'queued');
    },
  },
};
</script>

<style lang="scss" scoped></style>
