import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Rolldown (Vite 8) compatibility shim for TanStack Start's import-protection
 * virtual modules. Rolldown doesn't call the `load` hook for `\0`-prefixed
 * virtual module IDs when the hook's `filter` regex contains null chars, so
 * these mock modules end up as UNLOADABLE_DEPENDENCY errors at build time.
 *
 * This plugin intercepts those IDs in `resolveId` (before rolldown tries to
 * open them as files) and generates the mock code directly in `load`.
 */
function rolldownMockEdgeCompatPlugin(): Plugin {
  const MOCK_PREFIX = 'tanstack-start-import-protection:mock'
  const MOCK_EDGE_PREFIX = 'tanstack-start-import-protection:mock-edge:'
  const MOCK_BUILD_PREFIX = 'tanstack-start-import-protection:mock:build:'

  function silentMock(): string {
    return `
/* @__NO_SIDE_EFFECTS__ */
function createMock(name) {
  const fn = function () {};
  fn.prototype.name = name;
  const children = Object.create(null);
  const proxy = new Proxy(fn, {
    get(_target, prop) {
      if (prop === '__esModule') return true;
      if (prop === 'default') return proxy;
      if (prop === 'caller') return null;
      if (prop === 'then') return (f) => Promise.resolve(f(proxy));
      if (prop === 'catch') return () => Promise.resolve(proxy);
      if (prop === 'finally') return (f) => { f(); return Promise.resolve(proxy); };
      if (typeof prop === 'symbol') return undefined;
      if (!(prop in children)) {
        children[prop] = createMock(name + '.' + prop);
      }
      return children[prop];
    },
    apply() { return createMock(name + '()'); },
    construct() { return createMock('new ' + name); },
  });
  return proxy;
}
const mock = /* @__PURE__ */ createMock('mock');
export default mock;
`
  }

  return {
    name: 'rolldown-mock-edge-compat',
    // Run before other plugins so we intercept before rolldown's file resolver
    enforce: 'pre',
    resolveId(id) {
      if (
        id === MOCK_PREFIX ||
        id.startsWith(MOCK_EDGE_PREFIX) ||
        id.startsWith(MOCK_BUILD_PREFIX)
      ) {
        // Return a stable virtual ID using a plain prefix rolldown can handle
        return `\0${id}`
      }
    },
    load(id) {
      // Strip the leading null byte to get the original ID
      const bare = id.startsWith('\0') ? id.slice(1) : id
      if (bare === MOCK_PREFIX || bare.startsWith(MOCK_BUILD_PREFIX)) {
        return { code: silentMock() }
      }
      if (bare.startsWith(MOCK_EDGE_PREFIX)) {
        try {
          const payload = JSON.parse(
            Buffer.from(
              bare.slice(MOCK_EDGE_PREFIX.length),
              'base64url',
            ).toString(),
          ) as { exports?: string[]; runtimeId?: string }
          const exports = (payload.exports ?? []).filter(
            (n) => n.length > 0 && n !== 'default',
          )
          const exportLines = exports
            .map((n) => `export const ${n} = mock.${n};`)
            .join('\n')
          return {
            code: `${silentMock()}\n${exportLines}\n`,
          }
        } catch {
          return { code: silentMock() }
        }
      }
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    // Shim must come before tanstackStart so it resolves mock-edge IDs first
    rolldownMockEdgeCompatPlugin(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
