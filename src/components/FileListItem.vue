<template>
  <div>
    <v-list-item>
      <v-list-item-avatar>
        <v-icon class="indigo white--text">{{ getIconType(file.type) }}</v-icon>
      </v-list-item-avatar>

      <v-list-item-content>
        <v-list-item-title>{{ file.fileName }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ bytesToStr(file.transferred) }}/{{ bytesToStr(file.fileSize) }}
        </v-list-item-subtitle>
      </v-list-item-content>

      <v-list-item-action>
        <v-tooltip v-if="fileOpenButtonVisible(file)" top>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" @click="onClickOpenFile(file)">
              <v-icon>mdi-file-outline</v-icon>
            </v-btn>
          </template>
          <span>파일선택</span>
        </v-tooltip>

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
      </v-list-item-action>
    </v-list-item>
  </div>
</template>

<script>
import bytes from 'bytes';
import { EventBus } from '@/utils/event-bus';

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
      console.log('file', file);
      return !file.status || file.status === 'queued' || file.status === 'standby';
    },
    onClickListItem() {
      //
    },
  },
};
</script>

<style scoped></style>
