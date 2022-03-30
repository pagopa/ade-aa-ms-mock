import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { toBadRequestResponse } from "../utils/response";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const pathParamsMiddleware = <S, A>(type: t.Type<A, S>) => (
  request: FastifyRequest,
  _: FastifyReply
) =>
  pipe(
    request.params,
    type.decode,
    TE.fromEither,
    TE.mapLeft(toBadRequestResponse)
  );
