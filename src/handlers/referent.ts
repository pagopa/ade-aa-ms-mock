import { TableClient } from "@azure/data-tables";
import { FastifyReply, FastifyRequest } from "fastify";
import { IncomingMessage, Server } from "http";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { ReferentFiscalCode } from "../../generated/definitions/ReferentFiscalCode";

export const getReferentsHandler = (
  referentsTableClient: TableClient
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

export const insertReferentHandler = (
  referentsTableClient: TableClient
) => async (
  request: FastifyRequest<
    {
      Params: KeyOrganizationFiscalCode;
      Body: ReferentFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) => {
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
  const referentFiscalCode = request.body.referentFiscalCode;
};

export const deleteReferentHandler = (
  referentsTableClient: TableClient
) => async (
  request: FastifyRequest<
    {
      Params: KeyOrganizationFiscalCode;
      Body: ReferentFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) => {
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
  const referentFiscalCode = request.body.referentFiscalCode;
};
