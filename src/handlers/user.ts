import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";
import { UserCompanies } from "../../generated/definitions/UserCompanies";
import { upsertUser } from "../services/userService";

import {
  InternalServerErrorResponse,
  NotFoundResponse,
  toFastifyReply,
  toInternalServerError
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
  upsertUser(request.body, blobServiceClient, containerName, blobName)
    .mapLeft<InternalServerErrorResponse | NotFoundResponse>(
      toInternalServerError
    )
    .fold(toFastifyReply(reply), _ => reply.code(200).send({ upserted: _ }))
    .run();
