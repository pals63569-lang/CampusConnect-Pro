module.exports = {
  env: {
    node: true,
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  globals: {
    Swal: "readonly",
    API_URL: "writable",
    setToken: "writable",
    setCurrentUser: "writable",
    showToast: "writable",
    showAlert: "writable",
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
  },
};

