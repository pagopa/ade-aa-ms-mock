import {
  FiscalCode,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { Companies } from "../../../generated/definitions/Companies";
import { Company } from "../../../generated/definitions/Company";
import * as dbModels from "../../models/dbModels";
import { getCompanies } from "../companyService";

const aFiscalCode = "ISPXNB32R82Y766D" as FiscalCode;
const anotherFiscalCode = "ISPXNB32R82Y766L" as FiscalCode;
const anOrganizationFiscalCode = "00111111111" as OrganizationFiscalCode;

const aListOfOrganizations: ReadonlyArray<dbModels.Organization> = [
  ({
    fiscalCode: anOrganizationFiscalCode,
    name: "Test",
    pec: "aaa@prc.it",
    insertedAt: new Date().toISOString(),
    referents: [],
    associations: { referents: [] },
  } as unknown) as dbModels.Organization,
];

const aReferent: dbModels.Referent = ({
  fiscalCode: aFiscalCode,
  organizations: aListOfOrganizations,
  associations: { organizations: [] },
} as unknown) as dbModels.Referent;

const expectedListOfOrganizations: Companies = [
  {
    fiscalCode: anOrganizationFiscalCode,
    organizationName: "Test",
    pec: "aaa@prc.it",
  } as unknown as Company,
];

jest.mock("../../models/dbModels", () => ({
  __esModule: true,
  ...jest.requireActual("../../models/dbModels"),
  Referent: { findByPk: jest.fn(), associations: { organizations: {} } },
}));

const getUsersCompaniesMock = jest.spyOn(dbModels.Referent, "findByPk");

describe("getCompanies", () => {
  it("should return a list of related companies for the given fiscalCode", async () => {
    getUsersCompaniesMock.mockImplementation(async () => aReferent);
    await pipe(
      getCompanies(aFiscalCode),
      TE.bimap(
        (_) => {
          console.log(_);
          fail();
        },
        O.fold(
          () => fail(),
          (_) => expect(_).toEqual(expectedListOfOrganizations)
        )
      )
    )();
  });
  it("should return none if no company is found for the given fiscalCode", async () => {
    getUsersCompaniesMock.mockImplementation(async () => null);
    await pipe(
      getCompanies(anotherFiscalCode),
      TE.bimap(
        (_) => fail(),
        (maybeValue) => expect(O.isNone(maybeValue)).toBeTruthy()
      )
    )();
  });

  it("should return an error if companies parsing raise an Error", async () => {
    getUsersCompaniesMock.mockImplementation(async () => {
      throw "Cannot Parse JSON";
    });
    await pipe(
      getCompanies(anotherFiscalCode),
      TE.bimap(
        (_) => expect(_.message).toEqual("Cannot Parse JSON"),
        () => fail()
      )
    )();
  });
});
