<template>
  <div>
    <!-- <v-app-bar app>123</v-app-bar> -->
    <toolbar @alert="onToolbarAlert" />
    <v-content>
      <v-alert class="ma2" v-if="alert.type !== ''" :type="alert.type" dismissible>
        {{ alert.message }}</v-alert
      >
      <file-list />
    </v-content>
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
      alert: {
        type: '',
        message: '',
      },
    };
  },
  methods: {
    onToolbarAlert(alert) {
      this.alert = alert;
    },
  },
};
</script>
