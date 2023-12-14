import {
  apiUrl,
  generateDeleteProfileRequestPayload,
  generateGetProfilesRequestPayload,
  generateProfileLoginRequestPayload,
  generateProfileRegistrationRequestPayload,
  generateRequestHeaders,
  generateUserCreationRequestPayload,
  instance,
  processOperations,
  setupDatabase,
} from "./helpers";
import { expect } from "chai";

import { getUnixTime } from "date-fns";

// TODO: Add more cases

describe("(Master account) Profile actions", () => {
  it("should successfully create one profile", async () => {
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
      const workspaceResult = setupResult[0];
      const authToken = setupResult[2];
      const workspace_id = workspaceResult.id;

      const email = "email@email.com";
      const name = "Test user";
      const password = "123";
      const workspaceProfileData = {
        status: "ACTIVE" as const,
        access: "TEAM_MEMBER" as const,
        title: "",
      };

      const beforeRequestTimestamp = getUnixTime(new Date());
      const response = await instance.post(
        apiUrl,
        generateUserCreationRequestPayload({
          workspace_id,
          email,
          name,
          password,
          workspace: workspaceProfileData,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );
      const afterRequestTimestamp = getUnixTime(new Date());
      const responseData = response.data.data.createProfile;
      const responseErrors = response.data.errors;
      expect(responseData.email).to.equal(email);
      expect(responseData.name).to.equal(name);
      expect(responseData.is_completed).to.equal(false);
      expect(responseData.image).to.equal(null);
      expect(responseData.workspace).to.deep.equal({
        workspace_id,
        profile_id: responseData.id,
        ...workspaceProfileData,
      });
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
            access: "TEAM_MEMBER",
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
      const email = "test@ahaplay.com";
      const name = "Another Test user";
      const password = "123";
      const authToken = setupResult[2];

      const response2 = await instance.post(
        apiUrl,
        generateUserCreationRequestPayload({
          email,
          name,
          password,
          workspace_id: setupResult[0].id,
          workspace: {
            access: "TEAM_MEMBER",
            status: "ACTIVE",
            title: "",
          },
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      expect(response2.data?.errors?.length).to.be.greaterThan(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should get all profiles", async () => {
    try {
      const setupData = [
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["ahaplay.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile 1",
            email: "test@ahaplay.com",
            workspace_id: "[0].id",
            access: "TEAM_MEMBER",
            status: "ACTIVE",
          },
        },
        {
          key: "getAuthToken",
          data: {
            email: "[1].email",
          },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile 2",
            email: "test-2@ahaplay.com",
            workspace_id: "[0].id",
            access: "ADMIN",
            status: "ACTIVE",
          },
        },
        {
          key: "createWorkspace",
          data: { name: "My test workspace 2", domains: ["email2.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile 3",
            email: "test-1@email2.com",
            workspace_id: "[4].id",
            access: "OWNER",
            status: "ACTIVE",
          },
        },
      ];
      const setupResult = await setupDatabase(setupData);
      const authToken = setupResult[2];

      const responseGetProfiles = await instance.post(
        apiUrl,
        generateGetProfilesRequestPayload(),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const responseData = responseGetProfiles.data.data.getProfiles;
      const responseErrors = responseGetProfiles.data.errors;

      const firstWorkspaceData = setupResult[0];
      const firstProfileData = setupResult[1];
      const secondProfileData = setupResult[3];
      const secondWorkspaceData = setupResult[4];
      const thirdProfileData = setupResult[5];

      const profileResultOne = responseData.find(
        (d: any) => d.email === firstProfileData.email
      );
      const profileResultTwo = responseData.find(
        (d: any) => d.email === secondProfileData.email
      );
      const profileResultThree = responseData.find(
        (d: any) => d.email === thirdProfileData.email
      );

      expect(responseData.length).to.equal(3);
      expect(profileResultOne).to.exist;
      expect(profileResultTwo).to.exist;
      expect(profileResultThree).to.exist;

      expect(profileResultOne.id).to.equal(firstProfileData.id);
      expect(profileResultTwo.id).to.equal(secondProfileData.id);
      expect(profileResultThree.id).to.equal(thirdProfileData.id);

      expect(profileResultOne.workspace.workspace_id).to.equal(
        firstWorkspaceData.id
      );
      expect(profileResultTwo.workspace.workspace_id).to.equal(
        firstWorkspaceData.id
      );
      expect(profileResultThree.workspace.workspace_id).to.equal(
        secondWorkspaceData.id
      );

      expect(profileResultOne.workspace.access).to.equal("TEAM_MEMBER");
      expect(profileResultTwo.workspace.access).to.equal("ADMIN");
      expect(profileResultThree.workspace.access).to.equal("OWNER");

      expect(profileResultOne.workspace.status).to.equal("ACTIVE");
      expect(profileResultTwo.workspace.status).to.equal("ACTIVE");
      expect(profileResultThree.workspace.status).to.equal("ACTIVE");

      expect(responseErrors).to.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should delete a given profile", async () => {
    try {
      const setupData = [
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["ahaplay.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile 1",
            email: "test@ahaplay.com",
            workspace_id: "[0].id",
            access: "TEAM_MEMBER",
            status: "ACTIVE",
          },
        },
        {
          key: "getAuthToken",
          data: {
            email: "[1].email",
          },
        },
        {
          key: "createWorkspace",
          data: { name: "My other test workspace", domains: ["email.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile 2",
            email: "test-2@email.com",
            workspace_id: "[3].id",
            access: "ADMIN",
            status: "ACTIVE",
          },
        },
      ];
      const setupResult = await setupDatabase(setupData);
      const authToken = setupResult[2];
      const profileForRemovalWorkspaceId = setupResult[3].id;
      const profileForRemovalId = setupResult[4].id;

      const responseRemoveProfile = await instance.post(
        apiUrl,
        generateDeleteProfileRequestPayload({
          deleteProfileId: profileForRemovalId,
          workspaceId: profileForRemovalWorkspaceId,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const responseData = responseRemoveProfile.data.data.deleteProfile;
      const responseErrors = responseRemoveProfile.data.errors;

      expect(responseData.id).to.equal(setupResult[4].id);
      expect(responseData.email).to.equal(setupResult[4].email);
      expect(responseData.workspace.workspace_id).to.equal(
        setupResult[4].workspaceProfile.workspace_id
      );

      expect(responseErrors).to.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});

describe("(Client account) Profile", () => {
  it("should successfully register a new profile and login", async () => {
    try {
      const workspaceDomain = "test.com";
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: [workspaceDomain] },
        },
      ]);
      const workspaceResult = setupResult[0];
      const email = "email@test.com";
      const name = "Test user";
      const password = "123";
      const beforeRequestsTimestamp = getUnixTime(new Date());

      const registerResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders({ origin: workspaceDomain }) }
      );
      const afterRequestsTimestamp = getUnixTime(new Date());

      const opsResponse = await processOperations([
        { key: "updateProfile", data: { email, is_completed: true } },
      ]);

      const loginResponse = await instance.post(
        apiUrl,
        generateProfileLoginRequestPayload({
          email,
          password,
        }),
        { headers: generateRequestHeaders({ origin: workspaceDomain }) }
      );

      const registrationResponseData =
        registerResponse.data.data.registerProfile;
      const registrationResponseErrors = registerResponse.data.errors;

      const loginResponseData = loginResponse.data.data.login;
      const loginResponseErrors = loginResponse.data.errors;

      expect(registrationResponseData.email).to.equal(email);
      expect(registrationResponseData.name).to.equal(name);

      expect(loginResponseData.profile.email).to.equal(email);
      expect(loginResponseData.profile.name).to.equal(name);
      expect(loginResponseData.profile.is_completed).to.equal(true);
      expect(loginResponseData.profile.image).to.equal(null);
      expect(loginResponseData.profile.workspace.workspace_id).to.equal(
        workspaceResult.id
      );
      expect(typeof loginResponseData.profile.id).to.equal("string");
      expect(typeof loginResponseData.token).to.equal("string");

      expect(loginResponseData.profile.create_date).to.be.greaterThanOrEqual(
        beforeRequestsTimestamp
      );
      expect(loginResponseData.profile.create_date).to.be.lessThanOrEqual(
        afterRequestsTimestamp
      );
      expect(registrationResponseErrors).to.equal(undefined);
      expect(loginResponseErrors).to.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should register a new profile and not login because profile is not completed", async () => {
    try {
      const workspaceDomain = "test.com";
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: [workspaceDomain] },
        },
      ]);
      const workspaceResult = setupResult[0];
      const email = "email@test.com";
      const name = "Test user";
      const password = "123";
      const beforeRequestsTimestamp = getUnixTime(new Date());

      const registerResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders({ origin: workspaceDomain }) }
      );
      const afterRequestsTimestamp = getUnixTime(new Date());

      const loginResponse = await instance.post(
        apiUrl,
        generateProfileLoginRequestPayload({
          email,
          password,
        }),
        { headers: generateRequestHeaders({ origin: workspaceDomain }) }
      );

      const registrationResponseData =
        registerResponse.data.data.registerProfile;
      const registrationResponseErrors = registerResponse.data.errors;

      const loginResponseData = loginResponse.data.data;
      const loginResponseErrors = loginResponse.data.errors;

      expect(registrationResponseData.email).to.equal(email);
      expect(registrationResponseData.name).to.equal(name);

      expect(loginResponseData).to.equal(null);
      expect(registrationResponseErrors).to.equal(undefined);
      expect(loginResponseErrors.length).to.be.greaterThan(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should not register a new profile from not existing workspace", async () => {
    try {
      const workspaceDomain = "test.com";
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: [workspaceDomain] },
        },
      ]);
      const email = "email@best.com";
      const name = "Test user";
      const password = "123";

      const registerResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email,
          name,
          password,
        }),
        { headers: generateRequestHeaders({ origin: "best.com" }) }
      );

      const profileResponseData = registerResponse.data.data;
      const profileResponseErrors = registerResponse.data.errors;

      expect(profileResponseErrors.length).to.be.greaterThan(0);
      expect(profileResponseData).to.equal(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should successfully return sent profile data if user is already registered", async () => {
    try {
      const workspaceDomain = "test.com";
      const setupData = [
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: [workspaceDomain] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile",
            email: `test@${workspaceDomain}`,
            workspace_id: "[0].id",
            access: "TEAM_MEMBER",
            status: "ACTIVE",
          },
        },
      ];
      const setupResult = await setupDatabase(setupData);

      const name = "HELLO WORLD";
      const password = "TEST 123";
      const registerResponse = await instance.post(
        apiUrl,
        generateProfileRegistrationRequestPayload({
          email: setupData[1].data.email!,
          name,
          password,
        }),
        { headers: generateRequestHeaders({ origin: workspaceDomain }) }
      );
      const afterRequestsTimestamp = getUnixTime(new Date());

      const loginResponse = await instance.post(
        apiUrl,
        generateProfileLoginRequestPayload({
          email: setupData[1].data.email!,
          password,
        }),
        { headers: generateRequestHeaders({ origin: workspaceDomain }) }
      );

      const registrationResponseData =
        registerResponse.data.data.registerProfile;
      const registrationResponseErrors = registerResponse.data.errors;

      const loginResponseData = loginResponse.data;
      const loginResponseErrors = loginResponse.data.errors;

      expect(registrationResponseData.email).to.equal(setupData[1].data.email!);
      expect(registrationResponseData.name).to.equal(name);

      expect(loginResponseData.data).to.equal(null);
      expect(registrationResponseErrors).to.equal(undefined);
      expect(loginResponseErrors.length).to.be.greaterThan(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  //   try {
  //     const workspaceName = "My cool workspace";
  //     const workspaceDomains = [{ domain: "test.com" }];
  //     const email = "email@test.com";
  //     const name = "Test user";
  //     const password = "123";

  //     const workspaceResponse = await instance.post(
  //       apiUrl,
  //       generateWorkspaceCreationRequestPayload({
  //         name: workspaceName,
  //         domains: workspaceDomains,
  //       }),
  //       { headers: generateRequestHeaders() }
  //     );

  //     const profileResponse = await instance.post(
  //       apiUrl,
  //       generateProfileRegistrationRequestPayload({
  //         email,
  //         name,
  //         password,
  //       }),
  //       {
  //         headers: generateRequestHeaders({ origin: "some-random-origin.com" }),
  //       }
  //     );

  //     const workspaceResponseData = workspaceResponse.data.data.createWorkspace;
  //     const workspaceResponseErrors = workspaceResponse.data.errors;
  //     const profileResponseData = profileResponse.data.data?.registerProfile;
  //     // const profileResponseErrors = profileResponse.data.errors;

  //     expect(typeof workspaceResponseData.id).to.equal("string");
  //     expect(workspaceResponseData.name).to.equal(workspaceName);
  //     expect(workspaceResponseData.domains).to.deep.equal(workspaceDomains);
  //     expect(workspaceResponseData.profiles).to.deep.equal([]);
  //     expect(workspaceResponseErrors).to.equal(undefined);

  //     expect(profileResponseData).to.equal(null);
  //   } catch (e) {
  //     console.error(e);
  //     throw e;
  //   }
  // });

  // it("should not register a new profile if request email domain is not found as domain of workspace", async () => {
  //   try {
  //     const workspaceName = "My cool workspace";
  //     const workspaceDomains = [{ domain: "some-random-domain.com" }];
  //     const email = "email@test.com";
  //     const name = "Test user";
  //     const password = "123";

  //     const workspaceResponse = await instance.post(
  //       apiUrl,
  //       generateWorkspaceCreationRequestPayload({
  //         name: workspaceName,
  //         domains: workspaceDomains,
  //       }),
  //       { headers: generateRequestHeaders({ origin: "test.com" }) }
  //     );

  //     const profileResponse = await instance.post(
  //       apiUrl,
  //       generateProfileRegistrationRequestPayload({
  //         email,
  //         name,
  //         password,
  //       }),
  //       {
  //         headers: generateRequestHeaders({ origin: "test.com" }),
  //       }
  //     );

  //     const workspaceResponseData = workspaceResponse.data.data.createWorkspace;
  //     const workspaceResponseErrors = workspaceResponse.data.errors;
  //     const profileResponseData = profileResponse.data.data?.registerProfile;
  //     // const profileResponseErrors = profileResponse.data.errors;

  //     expect(typeof workspaceResponseData.id).to.equal("string");
  //     expect(workspaceResponseData.name).to.equal(workspaceName);
  //     expect(workspaceResponseData.domains).to.deep.equal(workspaceDomains);
  //     expect(workspaceResponseData.profiles).to.deep.equal([]);
  //     expect(workspaceResponseErrors).to.equal(undefined);

  //     expect(profileResponseData).to.equal(null);
  //   } catch (e) {
  //     console.error(e);
  //     throw e;
  //   }
  // });

  // it("should successfully register a new profile and login", async () => {
  //   try {
  //     const workspaceName = "My cool workspace";
  //     const workspaceDomains = [{ domain: "test.com" }];
  //     const email = "email@test.com";
  //     const name = "Test user";
  //     const password = "123";
  //     const beforeRequestsTimestamp = getUnixTime(new Date());

  //     const workspaceResponse = await instance.post(
  //       apiUrl,
  //       generateWorkspaceCreationRequestPayload({
  //         name: workspaceName,
  //         domains: workspaceDomains,
  //       }),
  //       { headers: generateRequestHeaders() }
  //     );

  //     const profileResponse = await instance.post(
  //       apiUrl,
  //       generateProfileRegistrationRequestPayload({
  //         email,
  //         name,
  //         password,
  //       }),
  //       { headers: generateRequestHeaders({ origin: "test.com" }) }
  //     );

  //     const loginResponse = await instance.post(
  //       apiUrl,
  //       generateProfileLoginRequestPayload({
  //         email,
  //         password,
  //       }),
  //       { headers: generateRequestHeaders({ origin: "test.com" }) }
  //     );

  //     const afterRequestsTimestamp = getUnixTime(new Date());
  //     const workspaceResponseData = workspaceResponse.data.data.createWorkspace;
  //     const workspaceResponseErrors = workspaceResponse.data.errors;
  //     const profileResponseData = profileResponse.data.data.registerProfile;
  //     const profileResponseErrors = profileResponse.data.errors;
  //     const loginResponseData = loginResponse.data.data.login;
  //     const loginResponseErrors = loginResponse.data.errors;

  //     expect(typeof workspaceResponseData.id).to.equal("string");
  //     expect(workspaceResponseData.name).to.equal(workspaceName);
  //     expect(workspaceResponseData.domains).to.deep.equal(workspaceDomains);
  //     expect(workspaceResponseData.profiles).to.deep.equal([]);
  //     expect(workspaceResponseErrors).to.equal(undefined);

  //     expect(workspaceResponseData.create_date).to.be.greaterThanOrEqual(
  //       beforeRequestsTimestamp
  //     );
  //     expect(workspaceResponseData.create_date).to.be.lessThanOrEqual(
  //       afterRequestsTimestamp
  //     );

  //     expect(profileResponseData.email).to.equal(email);
  //     expect(profileResponseData.name).to.equal(name);
  //     expect(profileResponseData.is_completed).to.equal(false);
  //     expect(profileResponseData.image).to.equal(null);
  //     expect(profileResponseData.workspaces.length).to.equal(1);
  //     expect(typeof profileResponseData.workspaces[0].workspace_id).to.equal(
  //       "string"
  //     );
  //     expect(typeof profileResponseData.id).to.equal("string");
  //     expect(profileResponseData.create_date).to.be.equal(
  //       profileResponseData.update_date
  //     );
  //     expect(profileResponseData.create_date).to.be.greaterThanOrEqual(
  //       beforeRequestsTimestamp
  //     );
  //     expect(profileResponseData.create_date).to.be.lessThanOrEqual(
  //       afterRequestsTimestamp
  //     );
  //     expect(profileResponseErrors).to.equal(undefined);

  //     expect(loginResponseData.profile.email).to.equal(email);
  //     expect(loginResponseData.profile.name).to.equal(name);
  //     expect(loginResponseData.profile.is_completed).to.equal(false);
  //     expect(loginResponseData.profile.image).to.equal(null);
  //     expect(loginResponseData.profile.workspaces.length).to.equal(1);
  //     expect(
  //       typeof loginResponseData.profile.workspaces[0].workspace_id
  //     ).to.equal("string");
  //     expect(typeof loginResponseData.profile.id).to.equal("string");
  //     expect(loginResponseData.profile.create_date).to.be.equal(
  //       loginResponseData.profile.update_date
  //     );
  //     expect(loginResponseData.profile.create_date).to.be.greaterThanOrEqual(
  //       beforeRequestsTimestamp
  //     );
  //     expect(loginResponseData.profile.create_date).to.be.lessThanOrEqual(
  //       afterRequestsTimestamp
  //     );
  //     expect(typeof loginResponseData.token).to.equal("string");

  //     expect(loginResponseErrors).to.equal(undefined);
  //   } catch (e) {
  //     console.error(e);
  //     throw e;
  //   }
  // });
});
