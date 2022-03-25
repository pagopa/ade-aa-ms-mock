import { WithinRangeString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import { IncomingMessage, Server, ServerResponse } from "http";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import {
  getOrganizations,
  upsertOrganization,
} from "../services/organizationService";
import {
  toFastifyReply,
  toInternalServerError,
  toSuccessFastifyReply,
  toSuccessJsonResponse,
} from "../utils/response";
import { RouteGenericInterface } from "fastify/types/route";
import { Organizations } from "../../generated/definitions/Organizations";

export const IGetOrganizationsQueryString = t.partial({
  page: withDefault(t.number, 0),
  pageSize: withDefault(t.number, 20),
  searchQuery: WithinRangeString(1, 100),
});

export type IGetOrganizationsQueryString = t.TypeOf<
  typeof IGetOrganizationsQueryString
>;

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
      request.query.searchQuery
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
) => {
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
};

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
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
};
