import { SES } from "aws-sdk";
import { SendEmailRequest } from "aws-sdk/clients/ses";

import { IamRoleStatement } from "../awsResource";

export default class SesEmail {
  private readonly ses: SES;
  readonly fromEmail: string;
  readonly fromName: string;

  constructor(fromEmail: string, fromName: string) {
    this.ses = new SES();
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendEmail(
    email: string,
    subject: string,
    htmlMessage: string
  ): Promise<string> {
    const params: SendEmailRequest = {
      Destination: { ToAddresses: [email] },
      Message: {
        Body: { Html: { Charset: "UTF-8", Data: htmlMessage } },
        Subject: { Charset: "UTF-8", Data: subject },
      },
      Source: this.fromEmail,
    };

    return this.ses
      .sendEmail(params)
      .promise()
      .then((result) => result.MessageId);
  }

  static iamRoleStatements = (): IamRoleStatement => {
    return {
      Effect: "Allow",
      Action: [
        "ses:SendEmail",
        "ses:SendTemplatedEmail",
        "ses:SendRawEmail",
        "ses:SendBulkTemplatedEmail",
      ],
      Resource: `arn:aws:ses:us-east-1:*:identity/*`,
    };
  };
}
