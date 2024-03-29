//https://nextjs.org/docs/basic-features/eslint#lint-staged
const path = require('path')

const buildEslintCommand = (filenames) =>
  `next lint --fix --max-warnings=0 ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .filter(f => !f.endsWith('.lintstagedrc.js'))
    .map((f) => `--file ${f}`)
    .join(' ')}`

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
}