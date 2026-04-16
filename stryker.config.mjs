/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'vitest',
  mutate: ['src/lib/tlx.ts'],
  coverageAnalysis: 'perTest',
  thresholds: { high: 90, low: 80, break: 70 },
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
}
export default config
