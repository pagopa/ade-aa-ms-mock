import { IncomingMessage, Server, ServerResponse } from "http";
import { BlobServiceClient } from "@azure/storage-blob";
import { fastify, FastifyInstance } from "fastify";
import * as TE from "fp-ts/lib/TaskEither";
import { Sequelize } from "sequelize";
import { Companies } from "../generated/definitions/Companies";
import { GetCompaniesBody } from "../generated/definitions/GetCompaniesBody";
import { ReferentFiscalCode } from "../generated/definitions/ReferentFiscalCode";
import { KeyOrganizationFiscalCode } from "../generated/definitions/KeyOrganizationFiscalCode";
import { Organizations } from "../generated/definitions/Organizations";
import { OrganizationWithReferentsPost } from "../generated/definitions/OrganizationWithReferentsPost";
import { getCompaniesHandler } from "./handlers/company";
import {
  withDoubleRequestMiddlewares,
  withRequestMiddlewares,
} from "./middlewares/request_middleware";
import { requiredBodyMiddleware } from "./middlewares/required_body_payload";
import { getConfigOrThrow } from "./utils/config";
import {
  IDeleteReferentPathParams,
  IGetOrganizationsQueryString,
} from "./models/parameters";
import * as organizationHandler from "./handlers/organization";
import * as referentHandler from "./handlers/referent";
import { queryParamsMiddleware } from "./middlewares/query_params";
import { pathParamsMiddleware } from "./middlewares/path_params";
import { sequelizePostgresOptions } from "./utils/sequelize-options";
import { initModels } from "./models/dbModels";

const config = getConfigOrThrow();

// Create a http server. We pass the relevant typings for our http version used.
// By passing types we get correctly typed access to the underlying http objects in routes.
// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
const server: FastifyInstance<
  Server,
  IncomingMessage,
  ServerResponse
> = fastify({});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const blobServiceClient = BlobServiceClient.fromConnectionString(
  config.STORAGE_CONNECTION_STRING
);

const attributeAuthorityPostgresDb = new Sequelize(
  config.ATTRIBUTE_AUTHORITY_POSTGRES_DB_URI,
  sequelizePostgresOptions()
);

// Initialize models and sync them
initModels(attributeAuthorityPostgresDb);

server.addHook("preParsing", (request, reply, payload, done) => {
  if (
    ["POST", "DELETE"].includes(request.method) &&
    request.headers["content-type"] == "application/json" &&
    request.headers["content-length"] == "0"
  ) {
    delete request.headers["content-type"];
  }

  done();
});

server.get<{
  readonly Querystring: IGetOrganizationsQueryString;
  readonly Response: Organizations;
}>(
  "/organizations",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        queryParamsMiddleware(IGetOrganizationsQueryString)
      ),
  },
  organizationHandler.getOrganizationsHandler()
);

server.post<{ readonly Body: OrganizationWithReferentsPost }>(
  "/organizations",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        requiredBodyMiddleware(OrganizationWithReferentsPost)
      ),
  },
  organizationHandler.upsertOrganizationHandler()
);

server.get(
  "/organization/:keyOrganizationFiscalCode",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode)
      ),
  },
  organizationHandler.getOrganizationHandler()
);

server.delete(
  "/organization/:keyOrganizationFiscalCode",
  {
    // eslint-disable-next-line sonarjs/no-identical-functions
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode)
      ),
  },
  organizationHandler.deleteOrganizationHandler()
);

server.get(
  "/organization/:keyOrganizationFiscalCode/referents",
  {
    // eslint-disable-next-line sonarjs/no-identical-functions
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode)
      ),
  },
  referentHandler.getReferentsHandler()
);

server.post<{ readonly Body: ReferentFiscalCode }>(
  "/organization/:keyOrganizationFiscalCode/referents",
  {
    preHandler: async (request, reply) =>
      withDoubleRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(KeyOrganizationFiscalCode),
        requiredBodyMiddleware(ReferentFiscalCode)
      ),
  },
  referentHandler.insertReferentHandler()
);

server.delete(
  "/organization/:keyOrganizationFiscalCode/referents/:referentFiscalCode",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        pathParamsMiddleware(IDeleteReferentPathParams)
      ),
  },
  referentHandler.deleteReferentHandler()
);

/**
 * Legacy endpoint to serve hub-spid-login service
 */
server.post<{ readonly Body: GetCompaniesBody; readonly Response: Companies }>(
  "/companies",
  {
    preHandler: async (request, reply) =>
      withRequestMiddlewares(
        request,
        reply,
        requiredBodyMiddleware(GetCompaniesBody)
      ),
  },
  getCompaniesHandler()
);

server.get("/ping", {}, (_, reply) => TE.of(reply.code(200).send("OK"))());

server.listen(config.SERVER_PORT, "0.0.0.0", (err, address) => {
  if (err) {
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`server listening on ${address}`);
});
