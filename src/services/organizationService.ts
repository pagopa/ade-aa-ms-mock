import * as AR from "fp-ts/lib/Array";
import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { Organizations } from "../../generated/definitions/Organizations";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import {
  Organization as OrganizationModel,
  Referent,
} from "../models/dbModels";
import { Op, QueryTypes } from "sequelize";
import { UpdateOrganizationPrimaryKey } from "../utils/postgres_queries";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import {
  ISortByOrganizations,
  ISortDirectionOrganizations,
} from "../models/parameters";
import { NumberFromString } from "@pagopa/ts-commons/lib/numbers";

const filterByNameOrFiscalCode = (searchQuery?: string) =>
  pipe(
    O.fromNullable(searchQuery),
    O.map((searchQuery) => ({
      where: {
        [Op.or]: [
          { fiscal_code: { [Op.iLike]: `%${searchQuery}%` } },
          { name: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
    })),
    O.getOrElse(() => ({}))
  );

const paging = (page?: NumberFromString, pageSize?: NumberFromString) =>
  pipe(
    O.Do,
    O.bind("page", () => O.fromNullable(page)),
    O.bind("pageSize", () => O.fromNullable(pageSize)),
    O.map(({ page, pageSize }) => ({
      offset: page * pageSize,
      limit: pageSize,
    })),
    O.getOrElse(() => ({}))
  );

const ordering = (
  by?: ISortByOrganizations,
  direction?: ISortDirectionOrganizations
) =>
  pipe(
    O.Do,
    O.bind("by", () => O.fromNullable(by)),
    O.bind("order", () => O.fromNullable(direction)),
    O.map(({ by, order }) => ({
      order: [[by, order]],
    })),
    O.getOrElse(() => ({}))
  );

export const getOrganizations = (
  page?: NumberFromString,
  pageSize?: NumberFromString,
  searchQuery?: string,
  sortBy?: ISortByOrganizations,
  sortDirection?: ISortDirectionOrganizations
): TE.TaskEither<Error, Organizations> =>
  pipe(
    TE.Do,
    TE.bind("organizations", () =>
      TE.tryCatch(
        () =>
          OrganizationModel.findAll({
            include: [OrganizationModel.associations.referents],
            ...filterByNameOrFiscalCode(searchQuery),
            ...paging(page, pageSize),
            ...ordering(sortBy, sortDirection),
          }),
        E.toError
      )
    ),
    TE.bind("count", () =>
      TE.tryCatch(
        () =>
          OrganizationModel.count({
            ...filterByNameOrFiscalCode(searchQuery),
            ...paging(page, pageSize),
            ...ordering(sortBy, sortDirection),
          }),
        E.toError
      )
    ),
    TE.map(({ organizations, count }) =>
      pipe(
        organizations,
        AR.map((m) => ({
          keyOrganizationFiscalCode: m.fiscalCode,
          organizationFiscalCode: m.fiscalCode,
          organizationName: m.name,
          pec: m.pec,
          insertedAt: m.insertedAt,
          referents: m.referents.map((r) => r.fiscalCode),
        })),
        (items) => ({
          items,
          count,
        }),
        Organizations.decode,
        E.bimap((_) => E.toError("Cannot decode response"), identity),
        E.toUnion
      )
    )
  );

export const upsertOrganization = (
  organizationWithReferents: OrganizationWithReferents
): TE.TaskEither<Error, OrganizationWithReferents> =>
  pipe(
    TE.tryCatch(async () => {
      if (
        organizationWithReferents.keyOrganizationFiscalCode !==
        organizationWithReferents.organizationFiscalCode
      ) {
        await OrganizationModel.sequelize.query(UpdateOrganizationPrimaryKey, {
          raw: true,
          replacements: {
            new_fiscal_code: organizationWithReferents.organizationFiscalCode,
            old_fiscal_code:
              organizationWithReferents.keyOrganizationFiscalCode,
          },
          type: QueryTypes.UPDATE,
        });
      }
    }, E.toError),
    TE.chain(() =>
      TE.tryCatch(
        async () =>
          OrganizationModel.upsert({
            fiscalCode: organizationWithReferents.organizationFiscalCode,
            name: organizationWithReferents.organizationName,
            pec: organizationWithReferents.pec,
          }),
        E.toError
      )
    ),
    TE.chain(([organization, _]) =>
      pipe(
        TE.tryCatch(async () => await organization.getReferents(), E.toError),
        TE.chain((referentsToRemove) =>
          TE.tryCatch(
            async () =>
              await organization.removeReferents(referentsToRemove, {
                force: true,
              }),
            E.toError
          )
        ),
        TE.chain(() =>
          TE.tryCatch(
            async () =>
              (
                await Promise.all(
                  organizationWithReferents.referents.map((r) =>
                    Referent.upsert({ fiscalCode: r })
                  )
                )
              ).map(([r, _]) => r),
            E.toError
          )
        ),
        TE.chain((referents) =>
          TE.tryCatch(
            async () =>
              await organization.addReferents(referents, {
                ignoreDuplicates: true,
              }),
            E.toError
          )
        ),
        TE.chain(() =>
          pipe(
            OrganizationWithReferents.decode({
              keyOrganizationFiscalCode: organization.fiscalCode,
              organizationFiscalCode: organization.fiscalCode,
              organizationName: organization.name,
              pec: organization.pec,
              insertedAt: organization.insertedAt,
              referents: organizationWithReferents.referents,
            }),
            E.mapLeft(E.toError),
            TE.fromEither
          )
        )
      )
    )
  );

export const getOrganization = (
  keyOrganizationFiscalCode: FiscalCode
): TE.TaskEither<Error, O.Option<OrganizationWithReferents>> =>
  pipe(
    TE.tryCatch(
      () =>
        OrganizationModel.findByPk(keyOrganizationFiscalCode, {
          include: [OrganizationModel.associations.referents],
        }),
      E.toError
    ),
    TE.map((maybeOrganizationModel) =>
      pipe(
        O.fromNullable(maybeOrganizationModel),
        O.chain((org) =>
          pipe(
            OrganizationWithReferents.decode({
              keyOrganizationFiscalCode: org.fiscalCode,
              organizationFiscalCode: org.fiscalCode,
              organizationName: org.name,
              pec: org.pec,
              insertedAt: org.insertedAt,
              referents: org.referents.map((r) => r.fiscalCode),
            }),
            O.fromPredicate(E.isRight),
            O.map((o) => o.right)
          )
        )
      )
    )
  );

export const deleteOrganization = (
  keyOrganizationFiscalCode: FiscalCode
): TE.TaskEither<Error, O.Option<Promise<void>>> =>
  pipe(
    TE.tryCatch(
      () =>
        OrganizationModel.findByPk(keyOrganizationFiscalCode, {
          include: [OrganizationModel.associations.referents],
        }),
      E.toError
    ),
    TE.chain((maybeOrganizationModel) =>
      pipe(
        O.fromNullable(maybeOrganizationModel),
        TE.of,
        TE.chain((organizationModel) =>
          TE.tryCatch(
            async () =>
              pipe(
                organizationModel,
                O.map(async (org) => await org.destroy())
              ),
            E.toError
          )
        )
      )
    )
  );
