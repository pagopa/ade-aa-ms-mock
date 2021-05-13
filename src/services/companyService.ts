import { BlobServiceClient } from "@azure/storage-blob";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { fromNullable } from "fp-ts/lib/Option";
import { getBlobData } from "../utils/blob";
import { UsersCompanies } from "../utils/types";

export const getCompanies = (
  fiscalCode: FiscalCode,
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) =>
  getBlobData(blobServiceClient, containerName, blobName, UsersCompanies)
    .map(_ => _.find(elem => elem.fiscalCode === fiscalCode))
    .map(result => fromNullable(result).map(_ => _.companies));
