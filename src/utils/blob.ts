import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { parseJSON, toError } from "fp-ts/lib/Either";
import {
  fromEither,
  fromPredicate,
  TaskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { errorsToError } from "./errorsFormatter";

export const upsertBlob = (
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString,
  content: string
): TaskEither<Error, true> =>
  tryCatch(
    () =>
      blobServiceClient
        .getContainerClient(containerName)
        .getBlockBlobClient(blobName)
        .upload(content, content.length),
    toError
  )
    .map(_ => _._response)
    .chain(
      fromPredicate(
        response => response.status >= 200 && response.status < 300,
        () => new Error("Cannot upload content data to Blob")
      )
    )
    .map(() => true);

export const getBlobData = <S, A>(
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString,
  type: t.Type<A, S>
) =>
  tryCatch(
    () =>
      blobServiceClient
        .getContainerClient(containerName)
        .getBlockBlobClient(blobName)
        .downloadToBuffer(),
    toError
  )
    .map(buffer => buffer.toString("utf-8"))
    .chain(rawJson =>
      fromEither(
        parseJSON(rawJson, () => new Error("Cannot parse Json Blob"))
      ).chain(_ => fromEither(type.decode(_)).mapLeft(errorsToError))
    );
