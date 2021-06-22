module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
      'eslint:recommended',
      'plugin:import/errors',
      'plugin:import/warnings'
  ],
  env: {
      node: true,
      es6: true
  },
  parserOptions: {
      ecmaVersion: 2019,
      sourceType: 'module'
  },
  rules: {
    semi: ["error", "never"],
    quotes: ["error", "single"],
    indent: [2, 4],

    "import/no-unresolved": 0,
    "import/named": 2,
    "import/namespace": 2,
    "import/default": 2,
    "import/export": 2
  }
}
