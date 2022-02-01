import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import { UserCompanies } from "../../generated/definitions/UserCompanies";
import { upsertUser } from "../services/userService";

import {
  InternalServerErrorResponse,
  NotFoundResponse,
  toFastifyReply,
  toInternalServerError,
} from "../utils/response";

export const upsertUserHandler = (
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) => async (
  request: FastifyRequest<
    {
      Body: UserCompanies;
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
    upsertUser(request.body, blobServiceClient, containerName, blobName),
    TE.mapLeft(toInternalServerError),
    TE.bimap(toFastifyReply(reply), (_) =>
      reply.code(200).send({ upserted: _ })
    ),
    TE.toUnion
  )();
