import { createServer } from "node:http";
import { createApp, env } from "./app.js";
import { ensureUploadDirs } from "./lib/uploads.js";
import { initSocket } from "./lib/socket.js";

await ensureUploadDirs();

const app = createApp();
const server = createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`CaféOS API listening on http://localhost:${env.PORT}`);
});
