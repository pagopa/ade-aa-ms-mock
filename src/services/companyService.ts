import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { fromNullable } from "fp-ts/lib/Option";
import { parseUsers } from "../utils/json";

export const getCompanies = (fiscalCode: FiscalCode) =>
  parseUsers()
    .map(_ => _.find(elem => elem.fiscalCode === fiscalCode))
    .map(result => fromNullable(result).map(_ => _.companies));
