import Store from 'electron-store';

const store = new Store();

export const saveDownloadDir = dir => {
  store.set('downloadDir', dir);
};

export const loadDownloadDir = () => {
  return store.get('downloadDir');
};
