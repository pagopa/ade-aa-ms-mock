import * as AR from "fp-ts/lib/Array";
import { flow, pipe } from "fp-ts/lib/function";
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
import { Errors } from "io-ts";

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

const paging = (page?: number, pageSize?: number) =>
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

export const getOrganizations = (
  page?: number,
  pageSize?: number,
  searchQuery?: string
): TE.TaskEither<Error, Organizations> =>
  pipe(
    TE.tryCatch(
      () =>
        OrganizationModel.findAll({
          include: [OrganizationModel.associations.referents],
          ...filterByNameOrFiscalCode(searchQuery),
          ...paging(page, pageSize),
        }),
      E.toError
    ),
    TE.map(
      flow(
        AR.map((m) =>
          OrganizationWithReferents.decode({
            keyOrganizationFiscalCode: m.fiscalCode,
            organizationFiscalCode: m.fiscalCode,
            organizationName: m.name,
            pec: m.pec,
            insertedAt: m.insertedAt,
            referents: m.referents.map((r) => r.fiscalCode),
          })
        ),
        AR.filter(E.isRight),
        AR.map((e) => e.right)
      )
    )
  );

export const upsertOrganization = (
  organizationWithReferents: OrganizationWithReferents
): TE.TaskEither<Error, OrganizationWithReferents> =>
  pipe(
    TE.of(
      organizationWithReferents.keyOrganizationFiscalCode !==
        organizationWithReferents.organizationFiscalCode
    ),
    TE.chain((shouldUpdatePrimaryKey) =>
      TE.tryCatch(async () => {
        shouldUpdatePrimaryKey
          ? await OrganizationModel.sequelize.query(
              UpdateOrganizationPrimaryKey,
              {
                raw: true,
                replacements: {
                  new_fiscal_code:
                    organizationWithReferents.organizationFiscalCode,
                  old_fiscal_code:
                    organizationWithReferents.keyOrganizationFiscalCode,
                },
                type: QueryTypes.UPDATE,
              }
            )
          : void 0;
      }, E.toError)
    ),
    TE.chain(() =>
      TE.tryCatch(
        async () =>
          await OrganizationModel.upsert({
            fiscalCode: organizationWithReferents.organizationFiscalCode,
            name: organizationWithReferents.organizationName,
            pec: organizationWithReferents.pec,
          }),
        E.toError
      )
    ),
    TE.chain(([organization, _]) =>
      pipe(
        TE.tryCatch(async () => {
          const referentsToRemove = await organization.getReferents();
          await organization.removeReferents(referentsToRemove, {
            force: true,
          });
          const referents = (
            await Promise.all(
              organizationWithReferents.referents.map((r) =>
                Referent.upsert({ fiscalCode: r })
              )
            )
          ).map(([r, _]) => r);
          await organization.addReferents(referents, {
            ignoreDuplicates: true,
          });
        }, E.toError),
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
