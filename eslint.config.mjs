import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
const config = [
 ...nextVitals, ...nextTypescript,
 { ignores: ['node_modules/**', '.node_modules-before-beta/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/draco/**', '**/*.test.skip.ts', 'vitest-report.html'] },
]
export default config
