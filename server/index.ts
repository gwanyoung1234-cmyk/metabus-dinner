import { createServer } from "http";
import { attachGameSocket } from "./game";

/** Standalone socket-only server (optional). Prefer `npm run dev` combined server. */
const PORT = Number(process.env.SOCKET_PORT ?? 3001);

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("부어치킨 메타버스 Socket.IO 서버 (standalone)");
});

attachGameSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[socket] standalone listening on :${PORT}`);
});
