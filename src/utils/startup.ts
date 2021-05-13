import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { parseJSON, toError } from "fp-ts/lib/Either";
import {
  fromEither,
  TaskEither,
  taskify,
  tryCatch
} from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import { upsertBlob } from "./blob";
import { errorsToError } from "./errorsFormatter";
import { UsersCompanies } from "./types";

export const readFileAsync = taskify(fs.readFile);

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

export const initializeCompaniesBlob = (
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) =>
  tryCatch(
    () =>
      blobServiceClient.getContainerClient(containerName).createIfNotExists(),
    toError
  )
    .chain(() => parseUsers())
    .chain(_ =>
      upsertBlob(
        blobServiceClient,
        containerName,
        blobName,
        JSON.stringify(_, null, "\t")
      )
    );
