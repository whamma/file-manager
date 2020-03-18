import Store from 'electron-store';

const store = new Store();

export const saveDownloadDir = dir => {
  console.log('store', store);
  store.set('downloadDir', dir);
  console.log('after save', store);
};

export const loadDownloadDir = () => {
  return store.get('downloadDir');
};

export const loadIsDevelopment = () => {
  return store.get('isDevelopment');
};
