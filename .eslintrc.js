module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: ['react-app'],
  rules: {
    'import/no-anonymous-default-export': 'off',
  },
}