import { TableClient } from "@azure/data-tables";
import { WithinRangeString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { pipe } from "fp-ts/lib/function";
import { IncomingMessage, Server } from "http";
import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import { getOrganizations } from "../services/organizationService";
import { toFastifyReply, toInternalServerError } from "../utils/response";

export const IGetOrganizationsQueryString = t.partial({
  page: withDefault(t.number, 0),
  pageSize: withDefault(t.number, 20),
  organizationFiscalCode: WithinRangeString(8, 16),
  organizationName: WithinRangeString(1, 100),
});

export type IGetOrganizationsQueryString = t.TypeOf<
  typeof IGetOrganizationsQueryString
>;

export const getOrganizationsHandler = (
  organizationsTableClient: TableClient
) => async (
  request: FastifyRequest<
    { Querystring: IGetOrganizationsQueryString },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) =>
  pipe(
    getOrganizations(
      organizationsTableClient,
      request.query.page,
      request.query.pageSize,
      request.query.organizationFiscalCode,
      request.query.organizationName
    ),
    TE.mapLeft(toInternalServerError),
    TE.bimap(toFastifyReply(reply), reply.code(200).send),
    TE.toUnion
  );

export const upsertOrganizationHandler = (
  organizationsTableClient: TableClient
) => async (
  request: FastifyRequest<
    {
      Body: OrganizationWithReferents;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) => {
  const body = request.body;
};

export const getOrganizationHandler = (
  organizationsTableClient: TableClient
) => async (
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

export const deleteOrganizationHandler = (
  organizationsTableClient: TableClient
) => async (
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
