import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server } from "http";
import { GetCompaniesBody } from "../../generated/definitions/GetCompaniesBody";
import { getCompanies } from "../services/companyService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply,
} from "../utils/response";

export const getCompaniesHandler = () => async (
  request: FastifyRequest<
    {
      Body: GetCompaniesBody;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    getCompanies(request.body.fiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(TE.fromOption(() => toNotFoundResponse("Referent Not Found"))),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();
