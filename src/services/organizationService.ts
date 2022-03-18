import { TableClient } from "@azure/data-tables";
import * as tableStorage from "../utils/table_storage";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Organizations } from "../../generated/definitions/Organizations";

export const getOrganizations = (
  organizationsTableClient: TableClient,
  page: number,
  pageSize: number,
  organizationFiscalCode: string,
  organizationName: string
): TE.TaskEither<Error, Organizations> =>
  pipe(
    tableStorage.getPage(organizationsTableClient, Organizations)(
      page,
      pageSize,
      `PartitionKey eq ${organizationFiscalCode}`
    )
  );
