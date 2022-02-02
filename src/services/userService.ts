import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { UserCompanies } from "../../generated/definitions/UserCompanies";
import { getBlobData, upsertBlob } from "../utils/blob";
import { UsersCompanies } from "../utils/types";

export const upsertUser = (
  userCompanies: UserCompanies,
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) =>
  pipe(
    getBlobData(blobServiceClient, containerName, blobName, UsersCompanies),
    TE.chain(
      flow(
        TE.fromPredicate(
          (usersCompanies: UsersCompanies) =>
            usersCompanies.find(
              u => u.fiscalCode === userCompanies.fiscalCode
            ) !== undefined,
          _ => [..._, userCompanies]
        ),
        TE.map(_ => [
          ..._.filter(e => e.fiscalCode !== userCompanies.fiscalCode),
          userCompanies
        ]),
        TE.orElse(_ => TE.of(_))
      )
    ),
    TE.chain(_ =>
      upsertBlob(
        blobServiceClient,
        containerName,
        blobName,
        JSON.stringify(_, null, "\t")
      )
    )
  );
