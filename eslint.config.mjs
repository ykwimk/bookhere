import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// 기존에 쓰던 .eslintrc.json 규칙 그대로 (ESLint 9 는 .eslintrc 를 읽지 않아 flat config 로 옮김). import 플러그인은 next 설정이 이미 등록한다
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
            'unknown',
          ],
          pathGroups: [
            { pattern: 'react', group: 'builtin', position: 'before' },
            { pattern: 'react/**', group: 'builtin', position: 'before' },
            { pattern: 'next', group: 'builtin', position: 'after' },
            { pattern: 'next/**', group: 'builtin', position: 'after' },
            { pattern: 'public/**', group: 'unknown', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          warnOnUnassignedImports: true,
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.taste-skill/**',
  ]),
]);
