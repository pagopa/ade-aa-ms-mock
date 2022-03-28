import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import { IncomingMessage, Server, ServerResponse } from "http";
import * as TE from "fp-ts/TaskEither";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import {
  deleteOrganization,
  getOrganization,
  getOrganizations,
  upsertOrganization,
} from "../services/organizationService";
import {
  toFastifyReply,
  toInternalServerError,
  toNotFoundResponse,
  toSuccessFastifyReply,
} from "../utils/response";
import { RouteGenericInterface } from "fastify/types/route";
import { Organizations } from "../../generated/definitions/Organizations";
import { IGetOrganizationsQueryString } from "../models/parameters";

export const getOrganizationsHandler = () => async (
  request: FastifyRequest<
    { Querystring: IGetOrganizationsQueryString; Response: Organizations },
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
    getOrganizations(
      request.query.page,
      request.query.pageSize,
      request.query.searchQuery,
      request.query.sortBy,
      request.query.sortDirection
    ),
    TE.mapLeft(toInternalServerError),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

export const upsertOrganizationHandler = () => async (
  request: FastifyRequest<
    {
      Body: OrganizationWithReferents;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    upsertOrganization(request.body),
    TE.mapLeft(toInternalServerError),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

export const getOrganizationHandler = () => async (
  request: FastifyRequest<
    {
      Params: KeyOrganizationFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    getOrganization(request.params.keyOrganizationFiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() => toNotFoundResponse("Organization Not Found"))
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();

export const deleteOrganizationHandler = () => async (
  request: FastifyRequest<
    {
      Params: KeyOrganizationFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) => {
  pipe(
    deleteOrganization(request.params.keyOrganizationFiscalCode),
    TE.mapLeft(toInternalServerError),
    TE.chainW(
      TE.fromOption(() => toNotFoundResponse("Organization Not Found"))
    ),
    TE.bimap(toFastifyReply(reply), toSuccessFastifyReply(reply)),
    TE.toUnion
  )();
};
