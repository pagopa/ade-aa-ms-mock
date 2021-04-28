import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { identity } from "fp-ts/lib/function";
import { taskEither } from "fp-ts/lib/TaskEither";
import { fromEither, fromLeft } from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import * as t from "io-ts";
import { getCompanies } from "../services/companyService";

const GetCompaniesBody = t.interface({
  fiscalCode: FiscalCode
});

type GetCompaniesBody = t.TypeOf<typeof GetCompaniesBody>;

export const getCompaniesHandler = async (
  request: FastifyRequest<RouteGenericInterface, Server, IncomingMessage>,
  reply: FastifyReply<
    Server,
    IncomingMessage,
    ServerResponse,
    RouteGenericInterface,
    unknown
  >
) =>
  fromEither(GetCompaniesBody.decode(request.body))
    .mapLeft(() => reply.code(400).send("Bad Request"))
    .chain(requestBody =>
      getCompanies(requestBody.fiscalCode).mapLeft(err =>
        reply.code(500).send({ error: err.message })
      )
    )
    .chain(maybeResults =>
      maybeResults.foldL(
        () => fromLeft(reply.code(404).send("FiscalCode Not Found")),
        _ => taskEither.of(reply.code(200).send(_))
      )
    )
    .fold(identity, identity)
    .run();
