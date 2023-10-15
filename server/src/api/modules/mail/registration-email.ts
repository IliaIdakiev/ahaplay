import * as url from "url";
import { RegistrationModelInstance } from "src/database";
import { createEmail, sgMail } from "./main";
import config from "../../../config";

const noReplyEmail = config.app.email.defaults.noReplyEmail;
const emailConfirmationTemplateId =
  config.app.email.sendgridTemplateIds.emailConfirmation;
const serverUrl = new URL(config.app.serverUrl);

function createConfirmationUrl(registration: RegistrationModelInstance) {
  return url.format({
    protocol: serverUrl.protocol,
    host: serverUrl.host,
    pathname: `/registration/${registration.id}`,
    query: {
      token: registration.secret,
    },
  });
}

function createRegistrationEmail(registration: RegistrationModelInstance) {
  return createEmail({
    subject: "Challenge the author",
    to: registration.email,
    from: noReplyEmail,
    templateId: emailConfirmationTemplateId,
    data: {
      link: createConfirmationUrl(registration),
    },
  });
}

export function sendRegistrationEmail(registration: RegistrationModelInstance) {
  return sgMail.send(createRegistrationEmail(registration));
}
