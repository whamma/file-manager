<template>
  <v-list v-if="files && files.length > 0">
    <template v-for="file in files">
      <v-list-item :key="'item' + file.jobId" @click="onClickListItem">
        <v-list-item-avatar>
          <v-icon class="indigo white--text">{{ getIconType(file.type) }}</v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>{{ file.fileName }}</v-list-item-title>
          <v-list-item-subtitle
            >{{ bytesToStr(file.transferred) }}/{{
              bytesToStr(file.fileSize)
            }}</v-list-item-subtitle
          >
        </v-list-item-content>

        <v-list-item-action>
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
          <v-icon v-else-if="file.status === 'finished'" color="success" large
            >mdi-check-bold</v-icon
          >
          <v-icon v-else-if="file.status === 'error'" color="error" large>mdi-alert-circle</v-icon>
        </v-list-item-action>
      </v-list-item>
      <v-divider :key="'div' + file.jobId"></v-divider>
    </template>
  </v-list>
</template>

<script>
import bytes from 'bytes';

export default {
  name: 'file-list',
  computed: {
    files() {
      return this.$store.state.files;
    },
  },
  methods: {
    getIconType(type) {
      return type === 'upload' ? 'mdi-arrow-up-thick' : 'mdi-arrow-down-thick';
    },
    bytesToStr(bytesNumber) {
      return bytes(bytesNumber);
    },
    onClickListItem() {
      //
    },
  },
};
</script>

<style lang="scss" scoped></style>
