import { FastifyReply, FastifyRequest } from "fastify";
import { IncomingMessage, Server } from "http";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { ReferentFiscalCode } from "../../generated/definitions/ReferentFiscalCode";
import { IDeleteReferentPathParams } from "../models/parameters";

export const getReferentsHandler = () => async (
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

export const insertReferentHandler = () => async (
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

export const deleteReferentHandler = () => async (
  request: FastifyRequest<
    {
      Params: IDeleteReferentPathParams;
    },
    Server,
    IncomingMessage
  >,
  reply: FastifyReply
) => {
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
  const referentFiscalCode = request.params.referentFiscalCode;
};
