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
