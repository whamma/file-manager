import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

/*
  jobId: 123,
  filePath: 'd:\\테스트.mp4',
  fileName: '테스트.mp4',
  type: 'upload',
  status: 'working',
  fileSize: 4096,
  transferred: 1024,
  progress: 34,
  errors: null,
  server: {
    host: '',
    port: 0,
    user: '',
    password: '',
    path: ''
  },
  user: {
    userId: 'admin
  }
 */

export default new Vuex.Store({
  state: {
    files: [],
    config: {
      downloadDir: '',
      appVersion: '',
      os: '',
      isDevelopment: false,
    },
  },
  mutations: {
    addFile(state, payload) {
      payload.progress = 0;
      payload.transferred = 0;
      state.files = [...state.files, payload];
    },
    updateFile(state, payload) {
      const idx = state.files.findIndex(file => file.jobId === payload.jobId);
      if (idx < 0) {
        return;
      }
      state.files = [...state.files.slice(0, idx), payload, ...state.files.slice(idx + 1)];
    },
    setConfig(state, payload) {
      state.config = { ...payload };
    },
  },
  actions: {
    addFile({ commit }, payload) {
      commit('addFile', payload);
    },
    updateFile({ commit }, payload) {
      commit('updateFile', payload);
    },
    setConfig({ commit }, payload) {
      commit('setConfig', payload);
    },
  },
  modules: {},
});
