module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@stores": "./src/stores",
            "@api": "./src/api",
            "@services": "./src/services",
            "@constants": "./src/constants",
            "@theme": "./src/theme",
            "@t": "./src/types",
            "@types": "./src/types",
            "@utils": "./src/utils",
            "@navigation": "./src/navigation",
            "@i18n": "./src/i18n",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
