module.exports = function (api) {
    api.cache(true);
    let plugins = [];
  
    return {
      presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  
      plugins:[
        [
          'module:react-native-dotenv',
          {
            envName: 'APP_ENV',
            moduleName: '@env',
            path: '.env',
            blocklist: null,
            allowlist: null,
            safe: false,
            allowUndefined: true,
            verbose: false,
          },
        ],
      ]
    };
  };
  