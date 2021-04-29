import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import { RouteGenericInterface } from "fastify/types/route";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { IncomingMessage, Server, ServerResponse } from "http";
import { Response } from "../utils/response";

export const withRequestMiddlewares = (
  request: FastifyRequest,
  reply: FastifyReply,
  M1: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => TaskEither<Response, unknown>
) =>
  M1(request, reply)
    .fold(
      _ => reply.code(_.code).send(_),
      () => void 0
    )
    .run();

export const withDoubleRequestMiddlewares = (
  request: FastifyRequest,
  reply: FastifyReply,
  M1: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => TaskEither<Response, unknown>,
  M2: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => TaskEither<Response, unknown>
) =>
  M1(request, reply)
    .chain(() => M2(request, reply))
    .fold(
      _ => reply.code(_.code).send(_),
      () => void 0
    )
    .run();

export const withTripleRequestMiddlewares = (
  request: FastifyRequest,
  reply: FastifyReply,
  M1: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => TaskEither<Response, unknown>,
  M2: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => TaskEither<Response, unknown>,
  M3: (
    request: FastifyRequest,
    reply: FastifyReply
  ) => TaskEither<Response, unknown>
) =>
  M1(request, reply)
    .chain(() => M2(request, reply))
    .chain(() => M3(request, reply))
    .fold(_ => reply.code(_.code).send(_), void 0)
    .run();
