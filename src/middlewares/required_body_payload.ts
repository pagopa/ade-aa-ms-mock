import { FastifyReply, FastifyRequest } from "fastify";
import { fromEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { toBadRequestResponse } from "../utils/response";

export const requiredBodyMiddleware = <S, A>(type: t.Type<A, S>) => (
  request: FastifyRequest,
  _: FastifyReply
) => fromEither(type.decode(request.body)).mapLeft(toBadRequestResponse);
