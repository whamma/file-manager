import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import axios from 'axios';

const base = axios.create({
  baseURL: 'http://localhost/api/v1',
  timeout: 5000,
  headers: { 'X-API-KEY': 'B+Hqhy*3GEuJJmk%' },
});

Vue.prototype.$axios = base;

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App),
}).$mount('#app');
