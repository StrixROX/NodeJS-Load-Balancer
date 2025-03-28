import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parser: tsParser,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: true,
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  tseslint.configs.recommended,
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  {
    rules: {
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            orderImportKind: 'ignore',
            caseInsensitive: false,
          },
          named: true,
          'newlines-between': 'always-and-inside-groups',
          distinctGroup: true,
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'unknown',
          ],
          pathGroups: [
            // first constants
            {
              pattern: '**/*.constants.*',
              group: 'internal',
              position: 'before',
            },
            // then hooks
            {
              pattern: '**/use[A-Z]*',
              group: 'internal',
              position: 'before',
            },
            // then components
            {
              pattern: '**/[A-Z]*',
              group: 'internal',
              position: 'before',
            },
            // then styles
            {
              pattern: '**/*.css',
              group: 'internal',
              position: 'after',
            },
          ],
        },
      ],
    },
  },
]);
