import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { attachGameSocket } from "./game";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  attachGameSocket(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(`[metabus] 웹+소켓 통합 서버 http://localhost:${port}`);
    console.log(`[metabus] 외부 접속용으로 이 포트를 터널링하세요`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
