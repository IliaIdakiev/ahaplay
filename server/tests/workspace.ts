import {
  apiUrl,
  generateRequestHeaders,
  generateWorkspaceCreationRequestPayload,
  instance,
  setupDatabase,
} from "./helpers";
import { expect } from "chai";

import { getUnixTime } from "date-fns";

// TODO: Add more cases for the other operations

describe("(Master account) Workspace", () => {
  it("should successfully create a new workspace", async () => {
    try {
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["ahaplay.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile",
            email: "test@ahaplay.com",
            workspace_id: "[0].id",
            access: "OWNER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        {
          key: "getAuthToken",
          data: {
            email: "[1].email",
          },
        },
      ]);
      const authToken = setupResult[2];
      const name = "Test workspace";
      const domains = [{ domain: "test.com" }];

      const beforeRequestTimestamp = getUnixTime(new Date());

      const response = await instance.post(
        apiUrl,
        generateWorkspaceCreationRequestPayload({
          name,
          domains,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );
      const afterRequestTimestamp = getUnixTime(new Date());

      const responseData = response.data.data.createWorkspace;
      const responseErrors = response.data.errors;

      expect(typeof responseData.id).to.equal("string");
      expect(responseData.name).to.equal(name);
      expect(
        responseData.domains.map((d: any) => ({ domain: d.domain }))
      ).to.deep.equal(domains);
      expect(responseData.create_date).to.be.equal(responseData.update_date);
      expect(responseData.create_date).to.be.greaterThanOrEqual(
        beforeRequestTimestamp
      );
      expect(responseData.create_date).to.be.lessThanOrEqual(
        afterRequestTimestamp
      );
      expect(responseErrors).to.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
  it("should not create a new workspace due to domain collision", async () => {
    try {
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["ahaplay.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile",
            email: "test@ahaplay.com",
            workspace_id: "[0].id",
            access: "OWNER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        {
          key: "getAuthToken",
          data: {
            email: "[1].email",
          },
        },
      ]);
      const authToken = setupResult[2];
      const name = "Test workspace";
      const domains = [{ domain: "ahaplay.com" }];

      const response = await instance.post(
        apiUrl,
        generateWorkspaceCreationRequestPayload({
          name,
          domains,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const responseData = response.data.data;
      const responseErrors = response.data.errors;

      expect(responseData).to.equal(null);
      expect(responseErrors.length).to.be.greaterThan(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});

describe("(Client account) Profile", () => {
  it("should not create a new workspace", async () => {
    try {
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["test.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile",
            email: "test@test.com",
            workspace_id: "[0].id",
            access: "OWNER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        {
          key: "getAuthToken",
          data: {
            email: "[1].email",
          },
        },
      ]);

      const authToken = setupResult[2];
      const name = "Test workspace";
      const domains = [{ domain: "test.com" }];

      const response = await instance.post(
        apiUrl,
        generateWorkspaceCreationRequestPayload({
          name,
          domains,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const responseData = response.data.data;
      const responseErrors = response.data.errors;

      expect(responseData).to.equal(null);
      expect(responseErrors.length).to.be.greaterThan(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
