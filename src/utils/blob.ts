import { BlobServiceClient } from "@azure/storage-blob";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import { parse } from "fp-ts/lib/Json";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { errorsToError } from "./errorsFormatter";

export const upsertBlob = (
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString,
  content: string
): TE.TaskEither<Error, true> =>
  pipe(
    TE.tryCatch(
      () =>
        blobServiceClient
          .getContainerClient(containerName)
          .getBlockBlobClient(blobName)
          .upload(content, content.length),
      E.toError
    ),
    // eslint-disable-next-line no-underscore-dangle
    TE.map(uploadResponse => uploadResponse._response),
    TE.filterOrElse(
      response => response.status >= 200 && response.status < 300,
      () => new Error("Cannot upload content data to Blob")
    ),
    TE.map(() => true)
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getBlobData = <S, A>(
  blobServiceClient: BlobServiceClient,
  containerName: NonEmptyString,
  blobName: NonEmptyString,
  type: t.Type<A, S>
) =>
  pipe(
    TE.tryCatch(
      () =>
        blobServiceClient
          .getContainerClient(containerName)
          .getBlockBlobClient(blobName)
          .downloadToBuffer(),
      E.toError
    ),
    TE.map(buffer => buffer.toString("utf-8")),
    TE.chain(
      flow(
        parse,
        E.chainW(type.decode),
        E.mapLeft(errorsToError),
        TE.fromEither
      )
    )
  );
