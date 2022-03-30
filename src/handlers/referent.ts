import { IncomingMessage, Server } from "http";
import { FastifyReply, FastifyRequest } from "fastify";
import { KeyOrganizationFiscalCode } from "../../generated/definitions/KeyOrganizationFiscalCode";
import { ReferentFiscalCode } from "../../generated/definitions/ReferentFiscalCode";
import { IDeleteReferentPathParams } from "../models/parameters";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getReferentsHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: KeyOrganizationFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const insertReferentHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: KeyOrganizationFiscalCode;
      readonly Body: ReferentFiscalCode;
    },
    Server,
    IncomingMessage
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const referentFiscalCode = request.body.referentFiscalCode;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const deleteReferentHandler = () => async (
  request: FastifyRequest<
    {
      readonly Params: IDeleteReferentPathParams;
    },
    Server,
    IncomingMessage
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reply: FastifyReply
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const keyOrganizationFiscalCode = request.params.keyOrganizationFiscalCode;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const referentFiscalCode = request.params.referentFiscalCode;
};
