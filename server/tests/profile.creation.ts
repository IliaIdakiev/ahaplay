import axios from "axios";
import {
  apiUrl,
  generateProfileRegistrationRequestPayload,
  generateRequestHeaders,
  generateUserCreationRequestPayload,
  generateWorkspaceCreationRequestPayload,
} from "./helpers";
import { expect } from "chai";
import * as https from "https";
import { getUnixTime } from "date-fns";

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

describe("(Admin) Profile creation", () => {
  beforeEach(async () => {
    const response = await instance.delete("/recreate-database");
  });

  it("should successfully create one profile", async () => {
    try {
      const email = "email@email.com";
      const name = "Test user";
      const password = "123";

      const beforeRequestTimestamp = getUnixTime(new Date());
      const response = await instance.post(
        apiUrl,
        generateUserCreationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders() }
      );
      const afterRequestTimestamp = getUnixTime(new Date());
      const responseData = response.data.data.createProfile;
      const responseErrors = response.data.errors;
      expect(responseData.email).to.equal(email);
      expect(responseData.name).to.equal(name);
      expect(responseData.is_completed).to.equal(false);
      expect(responseData.image).to.equal(null);
      expect(responseData.workspaces).to.deep.equal([]);
      expect(typeof responseData.id).to.equal("string");
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

  it("should not create two profiles with the same email", async () => {
    try {
      const email = "email@email.com";
      const name = "Test user";
      const password = "123";

      const beforeRequestTimestamp = getUnixTime(new Date());
      const response1 = await instance.post(
        apiUrl,
        generateUserCreationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders() }
      );
      const response2 = await instance.post(
        apiUrl,
        generateUserCreationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders() }
      );

      const afterRequestTimestamp = getUnixTime(new Date());
      const responseData = response1.data.data.createProfile;
      const responseErrors = response1.data.errors;
      expect(responseData.email).to.equal(email);
      expect(responseData.name).to.equal(name);
      expect(responseData.is_completed).to.equal(false);
      expect(responseData.image).to.equal(null);
      expect(responseData.workspaces).to.deep.equal([]);
      expect(typeof responseData.id).to.equal("string");
      expect(responseData.create_date).to.be.equal(responseData.update_date);
      expect(responseData.create_date).to.be.greaterThanOrEqual(
        beforeRequestTimestamp
      );
      expect(responseData.create_date).to.be.lessThanOrEqual(
        afterRequestTimestamp
      );
      expect(responseErrors).to.equal(undefined);

      expect(response2.data?.errors?.length).to.be.greaterThan(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});

describe("(Client) Profile registration", () => {
  beforeEach(async () => {
    const response = await instance.delete("/recreate-database");
  });

  it("should successfully register a new profile from given origin and for workspace with the same domain", async () => {
    try {
      const workspaceName = "My cool workspace";
      const workspaceDomains = [{ domain: "test.com" }];
      const email = "email@test.com";
      const name = "Test user";
      const password = "123";
      const beforeRequestsTimestamp = getUnixTime(new Date());

      const workspaceResponse = await instance.post(
        apiUrl,
        generateWorkspaceCreationRequestPayload({
          name: workspaceName,
          domains: workspaceDomains,
        }),
        { headers: generateRequestHeaders() }
      );

      const profileResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders({ origin: "test.com" }) }
      );

      const afterRequestsTimestamp = getUnixTime(new Date());
      const workspaceResponseData = workspaceResponse.data.data.createWorkspace;
      const workspaceResponseErrors = workspaceResponse.data.errors;
      const profileResponseData = profileResponse.data.data.registerProfile;
      const profileResponseErrors = profileResponse.data.errors;

      expect(typeof workspaceResponseData.id).to.equal("string");
      expect(workspaceResponseData.name).to.equal(workspaceName);
      expect(workspaceResponseData.domains).to.deep.equal(workspaceDomains);
      expect(workspaceResponseData.profiles).to.deep.equal([]);
      expect(workspaceResponseErrors).to.equal(undefined);

      expect(workspaceResponseData.create_date).to.be.greaterThanOrEqual(
        beforeRequestsTimestamp
      );
      expect(workspaceResponseData.create_date).to.be.lessThanOrEqual(
        afterRequestsTimestamp
      );

      expect(profileResponseData.email).to.equal(email);
      expect(profileResponseData.name).to.equal(name);
      expect(profileResponseData.is_completed).to.equal(false);
      expect(profileResponseData.image).to.equal(null);
      expect(profileResponseData.workspaces.length).to.equal(1);
      expect(typeof profileResponseData.workspaces[0].workspace_id).to.equal(
        "string"
      );
      expect(typeof profileResponseData.id).to.equal("string");
      expect(profileResponseData.create_date).to.be.equal(
        profileResponseData.update_date
      );
      expect(profileResponseData.create_date).to.be.greaterThanOrEqual(
        beforeRequestsTimestamp
      );
      expect(profileResponseData.create_date).to.be.lessThanOrEqual(
        afterRequestsTimestamp
      );
      expect(profileResponseErrors).to.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should not register a new profile if request origin is not found as domain of workspace", async () => {
    try {
      const workspaceName = "My cool workspace";
      const workspaceDomains = [{ domain: "test.com" }];
      const email = "email@test.com";
      const name = "Test user";
      const password = "123";

      const workspaceResponse = await instance.post(
        apiUrl,
        generateWorkspaceCreationRequestPayload({
          name: workspaceName,
          domains: workspaceDomains,
        }),
        { headers: generateRequestHeaders() }
      );

      const profileResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email,
          name,
          password,
        }),
        {
          headers: generateRequestHeaders({ origin: "some-random-origin.com" }),
        }
      );

      const workspaceResponseData = workspaceResponse.data.data.createWorkspace;
      const workspaceResponseErrors = workspaceResponse.data.errors;
      const profileResponseData = profileResponse.data.data?.registerProfile;
      // const profileResponseErrors = profileResponse.data.errors;

      expect(typeof workspaceResponseData.id).to.equal("string");
      expect(workspaceResponseData.name).to.equal(workspaceName);
      expect(workspaceResponseData.domains).to.deep.equal(workspaceDomains);
      expect(workspaceResponseData.profiles).to.deep.equal([]);
      expect(workspaceResponseErrors).to.equal(undefined);

      expect(profileResponseData).to.equal(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should not register a new profile if request email domain is not found as domain of workspace", async () => {
    try {
      const workspaceName = "My cool workspace";
      const workspaceDomains = [{ domain: "some-random-domain.com" }];
      const email = "email@test.com";
      const name = "Test user";
      const password = "123";

      const workspaceResponse = await instance.post(
        apiUrl,
        generateWorkspaceCreationRequestPayload({
          name: workspaceName,
          domains: workspaceDomains,
        }),
        { headers: generateRequestHeaders({ origin: "test.com" }) }
      );

      const profileResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email,
          name,
          password,
        }),
        {
          headers: generateRequestHeaders({ origin: "test.com" }),
        }
      );

      const workspaceResponseData = workspaceResponse.data.data.createWorkspace;
      const workspaceResponseErrors = workspaceResponse.data.errors;
      const profileResponseData = profileResponse.data.data?.registerProfile;
      // const profileResponseErrors = profileResponse.data.errors;

      expect(typeof workspaceResponseData.id).to.equal("string");
      expect(workspaceResponseData.name).to.equal(workspaceName);
      expect(workspaceResponseData.domains).to.deep.equal(workspaceDomains);
      expect(workspaceResponseData.profiles).to.deep.equal([]);
      expect(workspaceResponseErrors).to.equal(undefined);

      expect(profileResponseData).to.equal(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
