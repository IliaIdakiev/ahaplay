import sgMail, { MailDataRequired } from "@sendgrid/mail";
import config from "../../config";

const sendgridApKey = config.app.email.sendgridApiKey;
sgMail.setApiKey(sendgridApKey);

export { sgMail };

export function createEmail<T>(config: {
  templateId: string;
  to: string;
  from: string;
  subject: string;
  data: T;
}): MailDataRequired {
  const { to, from, templateId, subject, data } = config;
  return {
    to,
    from,
    templateId,
    dynamicTemplateData: {
      subject,
      ...data,
    },
  };
}
