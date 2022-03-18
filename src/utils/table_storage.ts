import { TableClient, TableEntity } from "@azure/data-tables";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { asyncIterableToPageArray } from "./async";
import { errorsToError } from "./errorsFormatter";

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

export const getPage = <S, A>(tableClient: TableClient, type: t.Type<A, S>) => (
  page: number,
  pageSize: number,
  filter: string
) =>
  pipe(
    TE.tryCatch(
      () =>
        asyncIterableToPageArray(
          tableClient
            .listEntities({
              queryOptions: { filter },
            })
            .byPage({ maxPageSize: pageSize }),
          pageSize as NonNegativeInteger
        ),
      E.toError
    ),
    TE.chain(flow(type.decode, TE.fromEither, TE.mapLeft(errorsToError)))
  );
