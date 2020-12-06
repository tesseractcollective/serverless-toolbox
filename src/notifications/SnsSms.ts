import { SNS } from "aws-sdk";

import { IamRoleStatement } from "../awsResource";

export default class Sms {
  private isReady = false;
  private readonly sns: SNS;

  constructor(senderId: string, maxMonthlyDollarLimit: number = 1) {
    this.sns = new SNS({ region: "us-east-1" });
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#setSMSAttributes-property
  }

  async ready(): Promise<any> {
    if (this.isReady) {
      return Promise.resolve();
    }
    return this.sns
      .setSMSAttributes({
        attributes: {
          DefaultSMSType: "Transactional",
        },
      })
      .promise();
  }

  async sendSms(
    phoneNumber: string,
    message: string
  ): Promise<string | undefined> {
    await this.ready().then((response) => console.log(response));
    return this.sns
      .publish({
        Message: message,
        PhoneNumber: phoneNumber,
      })
      .promise()
      .then((result) => result.MessageId);
  }

  static iamRoleStatements = (): IamRoleStatement => {
    return {
      Effect: "Allow",
      Action: ["sns:SetSMSAttributes", "sns:Publish"],
      Resource: "*", // * for arbitrary mobile numbers
    };
  };
}
