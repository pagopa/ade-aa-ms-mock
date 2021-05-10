// tslint:disable: no-any
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
  OrganizationFiscalCode
} from "@pagopa/ts-commons/lib/strings";
import { isNone } from "fp-ts/lib/Option";
import { fromLeft, taskEither } from "fp-ts/lib/TaskEither";
import * as jsonUtil from "../../utils/json";
import { getCompanies } from "../companyService";

const aFiscalCode = "ISPXNB32R82Y766D" as FiscalCode;
const anotherFiscalCode = "ISPXNB32R82Y766L" as FiscalCode;
const anOrganizationFiscalCode = "00111111111" as OrganizationFiscalCode;
const aListOfCompanies: ReadonlyArray<any> = [
  {
    fiscalCode: anOrganizationFiscalCode,
    organizationName: "Test" as NonEmptyString,
    pec: "aaa@prc.it" as EmailString
  }
];
const aListOfUsersCompanies: ReadonlyArray<any> = [
  {
    companies: aListOfCompanies,
    fiscalCode: aFiscalCode
  }
];
const parseUsersMock = jest
  .fn()
  .mockImplementation(() =>
    taskEither.of<Error, jsonUtil.UsersCompanies>(aListOfUsersCompanies)
  );

jest.spyOn(jsonUtil, "parseUsers").mockImplementation(parseUsersMock);

describe("getCompanies", () => {
  it("should return a list of related companies for the given fiscalCode", async () => {
    await getCompanies(aFiscalCode)
      .fold(
        _ => fail(),
        maybeValue =>
          maybeValue.foldL(
            () => fail(),
            _ => expect(_).toEqual(aListOfCompanies)
          )
      )
      .run();
  });
  it("should return none if no company is found for the given fiscalCode", async () => {
    await getCompanies(anotherFiscalCode)
      .fold(
        _ => fail(),
        maybeValue => expect(isNone(maybeValue)).toBeTruthy()
      )
      .run();
  });

  it("should return an error if companies parsing raise an Error", async () => {
    parseUsersMock.mockImplementationOnce(() =>
      fromLeft(new Error("Cannot Parse JSON"))
    );
    await getCompanies(anotherFiscalCode)
      .fold(
        _ => expect(_.message).toEqual("Cannot Parse JSON"),
        () => fail()
      )
      .run();
  });
});
