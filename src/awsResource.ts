export type IamRoleStatement = {
  Sid?: string;
  Effect: "Allow" | "Deny";
  Action: string | string[];
  Resource: string | string[];
};

export interface IamPolicy {
  Version: string;
  Statement: IamRoleStatement[];
}

export interface IamPolicyForPrincipal {
  principalId: string;
  policyDocument: IamPolicy;
  context: any;
}

export type CloudFormation = {
  Type: string;
  Properties: {
    [key: string]: any;
  };
};

export function buildArn(
  service: string,
  resource: string,
  region: string = "us-east-1",
  accountId: string = "*"
): string {
  if (!service) {
    throw new Error("aws service name required (e.g. dynamodb)");
  }
  if (!resource) {
    throw new Error("aws resource name required (e.g. table/my-table-name)");
  }
  return `arn:aws:${service}:${region}:${accountId}:${resource}`;
}
