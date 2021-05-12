import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { fromPredicate, taskEither } from "fp-ts/lib/TaskEither";
import { UserCompanies } from "../../generated/definitions/UserCompanies";
import { getBlobData, upsertBlob } from "../utils/blob";
import { UsersCompanies } from "../utils/types";

export const upsertUser = (
  userCompanies: UserCompanies,
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) =>
  getBlobData(blobServiceClient, containerName, blobName, UsersCompanies)
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
    .chain(_ =>
      upsertBlob(
        blobServiceClient,
        containerName,
        blobName,
        JSON.stringify(_, null, "\t")
      )
    );
