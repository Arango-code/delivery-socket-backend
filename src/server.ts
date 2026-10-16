import "dotenv/config";
import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initializeSocket } from "./socket";

const server = http.createServer(app);

initializeSocket(server);

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Health check: http://localhost:${env.PORT}/health`);
});
