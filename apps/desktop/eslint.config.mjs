// ESLint for bise desktop: typed rules (typescript-eslint strictTypeChecked)
// on every .ts/.tsx through the two tsconfigs, React hooks rules on the
// renderer, plain JS rules on the scripts. `pnpm lint` fails on any warning.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['out/', 'dist/', 'node_modules/', '.harness-cache/', 'src/proto/'] },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['src/**/*.tsx', 'src/renderer/**/*.ts', 'src/app/**/*.ts'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: { globals: globals.node },
  },
);
