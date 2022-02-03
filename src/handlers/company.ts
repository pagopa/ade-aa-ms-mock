import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import { GetCompaniesBody } from "../../generated/definitions/GetCompaniesBody";
import { getCompanies } from "../services/companyService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse
} from "../utils/response";

export const getCompaniesHandler = (
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) => async (
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
  pipe(
    getCompanies(
      request.body.fiscalCode,
      blobServiceClient,
      containerName,
      blobName
    ),
    TE.mapLeft(toInternalServerError),
    TE.chainW(TE.fromOption(() => toNotFoundResponse("FiscalCode Not Found"))),
    TE.bimap(toFastifyReply(reply), reply.code(200).send),
    TE.toUnion
  )();
