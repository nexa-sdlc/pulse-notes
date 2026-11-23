import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { buildApp } from './app.js';

const webDir = process.env.WEB_DIR ?? fileURLToPath(new URL('../../web/dist', import.meta.url));

const app = await buildApp({
  dataDir: process.env.DATA_DIR ?? './data',
  commit: process.env.APP_COMMIT ?? 'dev',
  webDir: existsSync(webDir) ? webDir : undefined,
});

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
console.log(`pulse-notes api listening on :${process.env.PORT ?? 3000}`);
