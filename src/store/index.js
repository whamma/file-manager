import Vue from 'vue';
import Vuex from 'vuex';
import uuidv4 from 'uuid/v4';

Vue.use(Vuex);

/*
  id: uuid,
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
  },
  mutations: {
    addFile(state, payload) {
      payload.id = uuidv4();
      payload.status = 'queued';
      payload.progress = 0;
      payload.transferred = 0;
      state.files = [...state.files, payload];
    },
    updateFile(state, payload) {
      const idx = state.files.findIndex(file => file.id === payload.id);
      if (idx < 0) {
        return;
      }
      state.files = [...state.files.slice(0, idx), payload, ...state.files.slice(idx + 1)];
    },
  },
  actions: {
    addFile({ commit }, payload) {
      commit('addFile', payload);
    },
    updateFile({ commit }, payload) {
      commit('updateFile', payload);
    },
  },
  modules: {},
});
