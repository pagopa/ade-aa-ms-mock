import * as E from "fp-ts/Either";
import { OrganizationWithReferents } from "../../generated/definitions/OrganizationWithReferents";
import { OrganizationWithReferentsPost } from "../../generated/definitions/OrganizationWithReferentsPost";

const aValidFiscalCode = "AAAAAA00A00A000A";
const aValidPec = "apec@pec.it";
const anOrganizationName = "Organization";
const anOrganizationFiscalCode = "1234567890";

const aRightOrganizationWithReferents = {
  keyOrganizationFiscalCode: anOrganizationFiscalCode,
  organizationFiscalCode: anOrganizationFiscalCode,
  organizationName: anOrganizationName,
  pec: aValidPec,
  referents: [aValidFiscalCode],
};
const aLeftOrganizationWithReferents = {
  keyOrganizationFiscalCode: anOrganizationFiscalCode,
  organizationFiscalCode: anOrganizationFiscalCode,
  organizationName: anOrganizationName,
  pec: "notvalid",
};

describe("OrganizationWithReferents", () => {
  it("Should decode a correct OrganizationWithReferents", async () => {
    const decoded = OrganizationWithReferentsPost.decode(
      aRightOrganizationWithReferents
    );
    expect(E.isRight(decoded)).toBeTruthy();
  });

  it("Should not decode a wrong OrganizationWithReferents", async () => {
    const decoded = OrganizationWithReferentsPost.decode(
      aLeftOrganizationWithReferents
    );
    expect(E.isLeft(decoded)).toBeTruthy();
  });
});
