import { parseJSON } from "fp-ts/lib/Either";
import { fromEither, TaskEither, taskify } from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import * as t from "io-ts";
import { UserCompanies } from "../../generated/definitions/UserCompanies";
import { errorsToError } from "./errorsFormatter";

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
