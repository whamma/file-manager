process.env.VUE_APP_NODE_ENV = 'production';

module.exports = {
  transpileDependencies: ['vuetify'],
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'com.gemiso.file-manager',
        productName: 'File Manager',
        win: {
          icon: './src/assets/icon.ico',
          target: [
            {
              target: 'nsis',
              arch: ['ia32'],
            },
          ],
        },
        nsis: {
          installerIcon: './src/assets/icon.ico',
        },
        mac: {
          category: 'public.app-category.business',
          icon: './src/assets/icon.icns',
          target: ['default'],
        },
        protocols: [
          {
            name: 'file-manager',
            schemes: ['gemiso.file-manager'],
          },
        ],
      },
    },
  },
};
