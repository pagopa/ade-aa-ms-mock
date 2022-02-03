import {
  TableClient,
  TableEntity,
  TableEntityQueryOptions
} from "@azure/data-tables";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { errorsToError } from "./errorsFormatter";

const MAX_PAGE_SIZE = 10;

export const upsert = (tableClient: TableClient) => (
  entity: TableEntity<object>
) => TE.tryCatch(() => tableClient.upsertEntity(entity, "Replace"), E.toError);

export const del = (tableClient: TableClient) => (
  partitionKey: string,
  rowKey: string
) =>
  TE.tryCatch(() => tableClient.deleteEntity(partitionKey, rowKey), E.toError);

export const get = <S, A>(tableClient: TableClient, type: t.Type<A, S>) => (
  partitionKey: string,
  rowKey: string
) =>
  pipe(
    TE.tryCatch(() => tableClient.getEntity(partitionKey, rowKey), E.toError),
    TE.chain(flow(type.decode, TE.fromEither, TE.mapLeft(errorsToError)))
  );
