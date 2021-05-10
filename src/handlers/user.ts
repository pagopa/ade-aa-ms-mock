import { FastifyReply, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";
import { upsertUser } from "../services/userService";
import { UserCompanies } from "../utils/json";
import {
  InternalServerErrorResponse,
  NotFoundResponse,
  toFastifyReply,
  toInternalServerError
} from "../utils/response";

export const upsertUserHandler = async (
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
  upsertUser(request.body)
    .mapLeft<InternalServerErrorResponse | NotFoundResponse>(
      toInternalServerError
    )
    .fold(toFastifyReply(reply), _ => reply.code(200).send({ upserted: _ }))
    .run();
