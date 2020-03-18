<template>
  <v-dialog v-model="dialog" persistent max-width="550px">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on" :disabled="disabled" icon>
        <v-icon>mdi-tune</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">환경설정</span>
      </v-card-title>
      <v-card-text>
        <v-form class="px-3">
          <v-row no-gutters align="end">
            <v-col cols="10">
              <v-text-field
                label="다운로드 폴더"
                v-model="downloadDir"
                prepend-icon="mdi-folder"
                readonly
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="2" align="right" justify="center">
              <v-btn small color="primary" bottom @click="onClickOpenDir">...</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="dialog = false">닫기</v-btn>
        <v-btn color="primary" text @click="onSaveClick">저장</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { channels } from '@/shared/constants';

let ipcRenderer = null;
if (typeof window.require === 'function') {
  ipcRenderer = window.require('electron').ipcRenderer;
}

export default {
  props: {
    disabled: Boolean,
  },
  created() {
    this.listenIpcEvents();
  },
  updated() {
    if (this.downloadDir === '') {
      //console.log('updated', this.$store.state);
      this.downloadDir = this.$store.state.config.downloadDir;
    }
  },
  data() {
    return {
      dialog: false,
      downloadDir: '',
    };
  },
  methods: {
    listenIpcEvents() {
      if (!ipcRenderer) {
        return;
      }
      ipcRenderer.on(channels.DIR_OPEN, (event, selectedDir) => {
        // console.log('download dir:', selectedDir);
        this.downloadDir = selectedDir;
      });
    },
    onClickOpenDir() {
      if (!ipcRenderer) {
        return;
      }
      ipcRenderer.send(channels.DIR_OPEN, this.downloadDir);
    },
    onSaveClick() {
      this.$store.state.config.downloadDir = this.downloadDir;
      this.$store.dispatch('setConfig', this.$store.state.config);
      ipcRenderer.send(channels.SAVE_CONFIG, this.$store.state.config);
      this.dialog = false;
    },
  },
};
</script>
