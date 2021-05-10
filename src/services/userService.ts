import { fromPredicate, taskEither } from "fp-ts/lib/TaskEither";
import {
  parseUsers,
  UserCompanies,
  UsersCompanies,
  writeUsers
} from "../utils/json";

export const upsertUser = (userCompanies: UserCompanies) =>
  parseUsers()
    .chain(users =>
      fromPredicate(
        (usersCompanies: UsersCompanies) =>
          usersCompanies.find(
            u => u.fiscalCode === userCompanies.fiscalCode
          ) !== undefined,
        _ => [..._, userCompanies]
      )(users).foldTaskEither<Error, UsersCompanies>(
        _ => taskEither.of(_),
        _ =>
          taskEither.of([
            ..._.filter(e => e.fiscalCode !== userCompanies.fiscalCode),
            userCompanies
          ])
      )
    )
    .chain(writeUsers);
