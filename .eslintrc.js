module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Enforces single quotes for string literals
    'quotes': ['error', 'single', { 'avoidEscape': true }],

    // Ensures consistent spacing inside of braces in object literals and destructuring
    'object-curly-spacing': ['error', 'always'],

    // NEW: Ensures consistent spacing in import/export destructuring
    // This is the key rule for fixing your import statement spacing!
    'object-curly-newline': ['error', {
      'ImportDeclaration': 'never',
      'ExportDeclaration': 'never'
    }],

    // Enforces the consistent use of file extensions in import declarations
    'import/extensions': ['error', 'always', {
      js: 'always',
      json: 'always'
    }]
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json']
      }
    }
  }
};
