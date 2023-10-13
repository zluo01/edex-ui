module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:promise/recommended',
    'plugin:tailwindcss/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    indent: 'off',
    '@typescript-eslint/indent': 'off',
    semi: 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    'no-array-constructor': 'off',
    '@typescript-eslint/no-array-constructor': 'error',
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': ['error'],
    'no-extra-semi': 'off',
    '@typescript-eslint/no-extra-semi': ['error'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      2,
      {
        argsIgnorePattern: '^_',
      },
    ],
    'no-console': [
      2,
      {
        allow: ['warn', 'error', 'debug'],
      },
    ],
    camelcase: 'off',
    '@typescript-eslint/camelcase': 'off',
    'react/no-unknown-property': ['error', { ignore: ['augmented-ui'] }],
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
