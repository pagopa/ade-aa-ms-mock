import { fastify, FastifyInstance } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { getCompaniesHandler } from "./handlers/company";
import { getConfigOrThrow } from "./utils/config";

const config = getConfigOrThrow();

// Create a http server. We pass the relevant typings for our http version used.
// By passing types we get correctly typed access to the underlying http objects in routes.
// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
const server: FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({});

server.post("/check", getCompaniesHandler);

server.listen(config.SERVER_PORT, "0.0.0.0", (err, address) => {
  if (err) {
    process.exit(1);
  }
  // tslint:disable-next-line: no-console
  console.log(`server listening on ${address}`);
});
