import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const checks = [
	['TypeScript', 'typescript', 'bin/tsc', ['--noEmit', '--incremental', 'false']],
	['Application lint', 'eslint', 'bin/eslint.js', ['.']],
	['Tests including screenshot OCR', 'vitest', 'vitest.mjs', ['run', '--silent=passed-only']],
	['Production build', 'next', 'dist/bin/next', ['build', '--webpack']],
]

for (const [label, packageName, entry, args] of checks) {
	console.log(`\n${label}`)
	const cli = join(dirname(require.resolve(`${packageName}/package.json`)), entry)
	const result = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit', env: process.env })
	if (result.error) throw result.error
	if (result.status !== 0) process.exit(result.status ?? 1)
}
