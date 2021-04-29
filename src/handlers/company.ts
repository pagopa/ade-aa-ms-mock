import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { taskEither } from "fp-ts/lib/TaskEither";
import { fromLeft } from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import * as t from "io-ts";
import { getCompanies } from "../services/companyService";
import { Companies } from "../utils/json";
import {
  InternalServerErrorResponse,
  NotFoundResponse,
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse
} from "../utils/response";

export const GetCompaniesBody = t.interface({
  fiscalCode: FiscalCode
});

export type GetCompaniesBody = t.TypeOf<typeof GetCompaniesBody>;

export const getCompaniesHandler = async (
  request: FastifyRequest<
    {
      Body: GetCompaniesBody;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply<
    Server,
    IncomingMessage,
    ServerResponse,
    RouteGenericInterface,
    unknown
  >
) =>
  getCompanies(request.body.fiscalCode)
    .mapLeft<InternalServerErrorResponse | NotFoundResponse>(
      toInternalServerError
    )
    .chain<Companies>(maybeResults =>
      maybeResults.foldL(
        () => fromLeft(toNotFoundResponse("FiscalCode Not Found")),
        _ => taskEither.of(_)
      )
    )
    .fold(toFastifyReply(reply), _ => reply.code(200).send(_))
    .run();
