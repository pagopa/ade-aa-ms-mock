import {
  EmailString,
  FiscalCode,
  NonEmptyString,
  OrganizationFiscalCode
} from "@pagopa/ts-commons/lib/strings";
import { parseJSON } from "fp-ts/lib/Either";
import { fromEither, TaskEither, taskify } from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import * as t from "io-ts";
import { errorsToError } from "./errorsFormatter";

export const Companies = t.readonlyArray(
  t.interface({
    fiscalCode: OrganizationFiscalCode,
    organizationName: NonEmptyString,
    pec: EmailString
  }),
  "companies"
);

export type Companies = t.TypeOf<typeof Companies>;

export const UserCompanies = t.interface({
  companies: Companies,
  fiscalCode: FiscalCode
});
export type UserCompanies = t.TypeOf<typeof UserCompanies>;

export const UsersCompanies = t.readonlyArray(UserCompanies);

export type UsersCompanies = t.TypeOf<typeof UsersCompanies>;

export const readFileAsync = taskify(fs.readFile);

export const writeFileAsync = taskify(fs.writeFile);

export const parseUsers = (): TaskEither<Error, UsersCompanies> =>
  readFileAsync("./conf/companies.json")
    .bimap(
      err => new Error(`Error parsing JSON file ${err.message}`),
      rawData => Buffer.from(rawData).toString()
    )
    .chain(_ => fromEither(parseJSON(_, () => new Error("Cannot parse JSON"))))
    .chain(rawUsersCompanies =>
      fromEither(UsersCompanies.decode(rawUsersCompanies)).mapLeft(
        errorsToError
      )
    );

export const writeUsers = (usersCompanies: UsersCompanies) =>
  writeFileAsync(
    "./conf/companies.json",
    JSON.stringify(usersCompanies, null, "\t")
  ).map(() => true);
