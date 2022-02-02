import { BlobServiceClient } from "@azure/storage-blob";
import { fastify, FastifyInstance } from "fastify";
import * as TE from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import { Companies } from "../generated/definitions/Companies";
import { GetCompaniesBody } from "../generated/definitions/GetCompaniesBody";
import { UserCompanies } from "../generated/definitions/UserCompanies";
import { getCompaniesHandler } from "./handlers/company";
import { upsertUserHandler } from "./handlers/user";
import { withRequestMiddlewares } from "./middlewares/request_middleware";
import { requiredBodyMiddleware } from "./middlewares/required_body_payload";
import { getConfigOrThrow } from "./utils/config";
import { initializeCompaniesBlob } from "./utils/startup";

const config = getConfigOrThrow();

// Create a http server. We pass the relevant typings for our http version used.
// By passing types we get correctly typed access to the underlying http objects in routes.
// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
const server: FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({});

const blobServiceClient = BlobServiceClient.fromConnectionString(
  config.STORAGE_CONNECTION_STRING
);

if (!config.isProduction) {
  initializeCompaniesBlob(
    blobServiceClient,
    config.CONTAINER_NAME,
    config.BLOB_NAME
  )()
    // tslint:disable-next-line: no-console
    .then(() => console.log("Test Blob initialized"))
    // tslint:disable-next-line: no-console
    .catch(console.log);
}

server.post<{ Body: GetCompaniesBody; Response: Companies }>(
  "/companies",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        requiredBodyMiddleware(GetCompaniesBody)
      )
  },
  getCompaniesHandler(
    blobServiceClient,
    config.CONTAINER_NAME,
    config.BLOB_NAME
  )
);

server.post<{ Body: UserCompanies }>(
  "/user",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        requiredBodyMiddleware(UserCompanies)
      )
  },
  upsertUserHandler(blobServiceClient, config.CONTAINER_NAME, config.BLOB_NAME)
);

server.get("/ping", {}, (_, reply) => TE.of(reply.code(200).send("OK"))());

server.listen(config.SERVER_PORT, "0.0.0.0", (err, address) => {
  if (err) {
    process.exit(1);
  }
  // tslint:disable-next-line: no-console
  console.log(`server listening on ${address}`);
});
