import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/lib/Array";
import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
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
          flow(
            A.findFirst(
              element => element.fiscalCode === userCompanies.fiscalCode
            ),
            O.isSome
          ),
          previousUsersCompanies => [...previousUsersCompanies, userCompanies]
        ),
        TE.map(usersCompanies => [
          ...usersCompanies.filter(
            e => e.fiscalCode !== userCompanies.fiscalCode
          ),
          userCompanies
        ]),
        TE.orElse(TE.of)
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
