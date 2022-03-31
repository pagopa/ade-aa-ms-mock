import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import {
  Organization as OrganizationModel,
  Referent as ReferentModel
} from "../models/dbModels";
import { Referents } from "../../generated/definitions/Referents";

const findOrganizationByPk = (
  keyOrganizationFiscalCode: string
): TE.TaskEither<Error, OrganizationModel> =>
  TE.tryCatch(
    () =>
      OrganizationModel.findByPk(keyOrganizationFiscalCode, {
        include: [OrganizationModel.associations.referents]
      }),
    E.toError
  );

export const getReferents = (
  keyOrganizationFiscalCode: string
): TE.TaskEither<Error, O.Option<Referents>> =>
  pipe(
    findOrganizationByPk(keyOrganizationFiscalCode),
    TE.map(maybeOrganizationModel =>
      pipe(
        O.fromNullable(maybeOrganizationModel),
        O.chain(org =>
          pipe(
            Referents.decode(org.referents.map(r => r.fiscalCode)),
            O.fromPredicate(E.isRight),
            O.map(o => o.right)
          )
        )
      )
    )
  );

export const insertReferent = (
  keyOrganizationFiscalCode: string,
  referentFiscalCode: FiscalCode
): TE.TaskEither<Error, O.Option<Promise<void>>> =>
  pipe(
    findOrganizationByPk(keyOrganizationFiscalCode),
    TE.map(O.fromNullable),
    TE.chain(organizationModelOption =>
      pipe(
        TE.tryCatch(
          () =>
            ReferentModel.upsert({
              fiscalCode: referentFiscalCode
            }),
          E.toError
        ),
        TE.chain(([referent, _]) =>
          TE.tryCatch(
            async () =>
              pipe(
                organizationModelOption,
                O.map(organizationModel =>
                  organizationModel.addReferent(referent, {
                    ignoreDuplicates: true
                  })
                )
              ),
            E.toError
          )
        )
      )
    )
  );

export const deleteReferent = (
  _: string,
  referentFiscalCode: FiscalCode
): TE.TaskEither<Error, O.Option<Promise<void>>> =>
  pipe(
    TE.tryCatch(
      // eslint-disable-next-line sonarjs/no-identical-functions
      () => ReferentModel.findByPk(referentFiscalCode),
      E.toError
    ),
    TE.chain(maybeReferentModel =>
      pipe(
        O.fromNullable(maybeReferentModel),
        TE.of,
        TE.chain(referentModelOption =>
          TE.tryCatch(
            async () =>
              pipe(
                referentModelOption,
                O.map(async ref => await ref.destroy({ force: true }))
              ),
            E.toError
          )
        )
      )
    )
  );
