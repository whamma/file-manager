import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
/*
  jobId: 123,
  filePath: 'd:\\테스트.mp4',
  fileName: '테스트.mp4',
  type: 'upload',
  status: 'working',
  filesize: 4096,
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
/*
config: {
      downloadDir: '',
      appVersion: '',
      os: '',
      isDevelopment: false,
    }
*/

export default new Vuex.Store({
  state: {
    files: [],
    config: null,
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
    removeFile(state, payload) {
      state.files = state.files.filter(file => file.jobId !== payload.jobId);
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
    removeFile({ commit }, payload) {
      commit('removeFile', payload);
    },
    setConfig({ commit }, payload) {
      commit('setConfig', payload);
    },
  },
  modules: {},
});
