import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { parseJSON, toError } from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import { parse } from "fp-ts/lib/Json";
import * as TE from "fp-ts/lib/TaskEither";
import * as fs from "fs";
import { upsertBlob } from "./blob";
import { errorsToError } from "./errorsFormatter";
import { UsersCompanies } from "./types";

export const readFileAsync = TE.taskify(fs.readFile);

export const parseUsers = (): TE.TaskEither<Error, UsersCompanies> =>
  pipe(
    readFileAsync("./conf/companies.json"),
    TE.bimap(
      (err) => new Error(`Error parsing JSON file ${err.message}`),
      (rawData) => Buffer.from(rawData).toString()
    ),
    TE.chain(
      flow(
        parse,
        TE.fromEither,
        TE.mapLeft(() => new Error("Cannot parse JSON"))
      )
    ),
    TE.chain(
      flow(UsersCompanies.decode, TE.fromEither, TE.mapLeft(errorsToError))
    )
  );

export const initializeCompaniesBlob = (
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString
) =>
  pipe(
    TE.tryCatch(
      () =>
        blobServiceClient.getContainerClient(containerName).createIfNotExists(),
      toError
    ),
    TE.chain(() => parseUsers()),
    TE.chain((_) =>
      upsertBlob(
        blobServiceClient,
        containerName,
        blobName,
        JSON.stringify(_, null, "\t")
      )
    )
  );
