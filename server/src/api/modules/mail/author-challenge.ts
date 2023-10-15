import config from "../../../config";
import { AuthorChallengeModelInstance } from "../../../database";
import { MakeKeysRequired } from "../../../types/helpers";
import { createEmail, sgMail } from "./main";

const noReplyEmail = config.app.email.defaults.noReplyEmail;
const requestsEmail = config.app.email.defaults.requestsEmail;

const authorChallengeTemplateId =
  config.app.email.sendgridTemplateIds.authorChallenge;

type AuthorChallengeWithProfileAndWorkshop = MakeKeysRequired<
  AuthorChallengeModelInstance,
  "profile" | "workshop"
>;

function createAuthorChallengeEmail(
  authorChallenge: AuthorChallengeWithProfileAndWorkshop
) {
  return createEmail({
    subject: "Challenge the author",
    to: requestsEmail,
    from: noReplyEmail,
    templateId: authorChallengeTemplateId,
    data: {
      ProfileName: authorChallenge.profile!.name,
      ProfileEmail: authorChallenge.profile!.email,
      WorkshopTitle: authorChallenge.workshop!.topic,
      RequestMessage: authorChallenge.challenge,
    },
  });
}

export function sendAuthorChallengeEmail(
  authorChallenge: AuthorChallengeWithProfileAndWorkshop
) {
  return sgMail.send(createAuthorChallengeEmail(authorChallenge));
}
