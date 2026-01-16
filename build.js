import * as esbuild from 'esbuild';

const ESM_REQUIRE_SHIM = `import{createRequire as _createRequire}from'module';const require=_createRequire(import.meta.url);`;

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  packages: 'external',
  format: 'esm',
  outdir: 'dist',
  banner: {
    js: ESM_REQUIRE_SHIM
  }
});

console.log('Build completed successfully');
