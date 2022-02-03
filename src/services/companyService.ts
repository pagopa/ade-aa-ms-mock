import { BlobServiceClient } from "@azure/storage-blob";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Companies } from "../../generated/definitions/Companies";
import { getBlobData } from "../utils/blob";
import { UsersCompanies } from "../utils/types";

export const getCompanies = (
  fiscalCode: FiscalCode,
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
): TE.TaskEither<Error, O.Option<Companies>> =>
  pipe(
    getBlobData(blobServiceClient, containerName, blobName, UsersCompanies),
    TE.map(
      A.findFirstMap(elem =>
        elem.fiscalCode === fiscalCode ? O.some(elem.companies) : O.none
      )
    )
  );
