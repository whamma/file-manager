<template>
  <v-list v-if="files && files.length > 0">
    <template v-for="file in files">
      <file-list-item :file="file" :key="'item' + file.jobId" />
      <v-divider :key="'div' + file.jobId"></v-divider>
    </template>
  </v-list>
</template>

<script>
import FileListItem from '@/components/FileListItem';

export default {
  name: 'file-list',
  components: {
    FileListItem,
  },
  computed: {
    files() {
      return this.$store.state.files;
    },
  },
};
</script>

<style lang="scss" scoped></style>
