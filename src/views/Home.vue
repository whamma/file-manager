<template>
  <div>
    <toolbar />
    <v-container>
      <file-list />
    </v-container>
  </div>
</template>

<script>
import Toolbar from '@/components/Toolbar';
import FileList from '@/components/FileList';

export default {
  name: 'home',
  components: {
    Toolbar,
    FileList,
  },
  data() {
    return {
      value: 100,
    };
  },
};
</script>
