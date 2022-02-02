import { BlobServiceClient } from "@azure/storage-blob";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { getBlobData } from "../utils/blob";
import { UsersCompanies } from "../utils/types";

export const getCompanies = (
  fiscalCode: FiscalCode,
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) =>
  pipe(
    getBlobData(blobServiceClient, containerName, blobName, UsersCompanies),
    TE.map(_ => _.find(elem => elem.fiscalCode === fiscalCode)),
    TE.map(
      flow(
        O.fromNullable,
        O.map(_ => _.companies)
      )
    )
  );
