import { env } from './lib/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`);
  console.log(`[server] CORS origin: ${env.CLIENT_ORIGIN}`);
});
