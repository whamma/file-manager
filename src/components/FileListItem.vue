<template>
  <div>
    <v-list-item>
      <v-list-item-avatar>
        <v-icon class="indigo white--text">{{ getIconType(file.type) }}</v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title>{{ file.fileName }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ bytesToStr(file.transferred) }}/{{ bytesToStr(file.filesize) }}
          {{ printDuration(file.duration) }}
        </v-list-item-subtitle>
        <v-list-item-subtitle v-if="file.status === 'working'">
          {{ renderRemainTime(calcRemainTime(file)) }} ({{ bytesToStr(calcSpeed(file)) }}/초)
        </v-list-item-subtitle>
      </v-list-item-content>

      <v-list-item-action>
        <v-tooltip v-if="cancelButtonVisible(file)" top>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" @click="onClickCancel(file)">
              <v-icon>mdi-cancel</v-icon>
            </v-btn>
          </template>
          <span>취소</span>
        </v-tooltip>

        <v-tooltip v-if="fileDeleteButtonVisible(file)" top>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" @click="onClickRemoveFile(file)">
              <v-icon>mdi-trash-can-outline</v-icon>
            </v-btn>
          </template>
          <span>파일삭제</span>
        </v-tooltip>
      </v-list-item-action>

      <v-list-item-action v-if="fileOpenButtonVisible(file)">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" @click="onClickOpenFile(file)">
              <v-icon>mdi-file-outline</v-icon>
            </v-btn>
          </template>
          <span>파일선택</span>
        </v-tooltip>
      </v-list-item-action>

      <v-list-item-action v-if="statusIconVisible(file)">
        <v-progress-circular
          v-if="file.status === 'working'"
          :rotate="360"
          :size="50"
          :width="7"
          :value="file.progress"
          color="teal"
        >
          {{ file.progress }}
        </v-progress-circular>
        <v-icon v-else-if="file.status === 'finished'" color="success" large>mdi-check-bold</v-icon>
        <v-icon v-else-if="file.status === 'error'" color="error" large>mdi-alert-circle</v-icon>
        <v-icon v-else-if="file.status === 'canceled'" color="warning" large>mdi-cancel</v-icon>
      </v-list-item-action>
    </v-list-item>
  </div>
</template>

<script>
import bytes from 'bytes';
import { EventBus } from '@/utils/event-bus';
import { secToStr } from '@/utils/time';

export default {
  props: {
    file: Object,
  },
  methods: {
    getIconType(type) {
      return type === 'upload' ? 'mdi-arrow-up-thick' : 'mdi-arrow-down-thick';
    },
    bytesToStr(bytesNumber) {
      return bytes(bytesNumber);
    },
    onClickOpenFile(file) {
      EventBus.$emit('open-file', file);
    },
    fileOpenButtonVisible(file) {
      // console.log('file', file);
      return file.type === 'upload' && (!file.status || file.status === 'queued');
    },
    onClickRemoveFile(file) {
      this.$store.dispatch('removeFile', file);
    },
    fileDeleteButtonVisible(file) {
      // console.log('fileDeleteButtonVisible', file);
      return file.type === 'download' && file.status && file.status === 'canceled';
    },
    onClickCancel(file) {
      file.status = 'canceled';
      this.$store.dispatch('updateFile', file);
    },
    cancelButtonVisible(file) {
      return !file.status || file.status === 'queued';
    },
    statusIconVisible(file) {
      return (
        file.status &&
        (file.status === 'working' ||
          file.status === 'finished' ||
          file.status === 'error' ||
          file.status === 'canceled')
      );
    },
    renderRemainTime(remainTime) {
      let remainTimeStr = secToStr(remainTime, { hSep: '시 ', mSep: '분 ', sSep: '초 ' });

      if (remainTimeStr && remainTimeStr !== '') {
        remainTimeStr += '남음';
      }
      return remainTimeStr;
    },
    calcRemainTime(file) {
      const speed = this.calcSpeed(file);
      return Math.round((file.filesize - file.transferred) / speed);
    },
    calcSpeed(file) {
      if (!file.startedAt) {
        return;
      }
      const elapsed = Date.now() - file.startedAt;
      const speed = (file.transferred / elapsed) * 1000;

      return speed;
    },
    printDuration(duration) {
      if (!duration) {
        return '';
      }

      const durationStr = secToStr(duration);
      if (durationStr.isEmpty()) {
        return '';
      }

      return `(${durationStr})`;
    },
    onClickListItem() {
      //
    },
  },
};
</script>

<style scoped></style>
