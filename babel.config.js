module.exports = {
  "presets": [
    "@babel/typescript",
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": 18
        }
      }
    ]
  ],
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    "@babel/proposal-object-rest-spread"
  ]
};
