import { IamPolicyForPrincipal } from "../awsResource";

export interface TokenAuth {
  verifyToken: (token: string) => Promise<any>;
}

export interface ApiGatewayAuthorizerTokenEvent {
  type: "TOKEN";
  methodArn: string;
  authorizationToken: string;
}

export interface UserInfo {
  id: string;
  email: string;
  [key: string]: any;
}

export async function authHandler(
  event: ApiGatewayAuthorizerTokenEvent,
  authorizer: (token: string) => Promise<UserInfo>,
  tokenPrefix: string = "Bearer"
): Promise<IamPolicyForPrincipal> {
  try {
    const authToken = event.authorizationToken;
    const token = authToken.replace(tokenPrefix, "").trimStart();
    const userInfo = await authorizer(token);
    // log.info("success");
    return generateIamPolicy(userInfo, "Allow", event.methodArn);
  } catch (error) {
    // log.error(error);
    // return generateIamPolicy({}, "Deny", event.methodArn);
    // TODO: the following doesn't work with serverless-offline. Need to submit an issue/PR
    return Promise.reject("unauthorized");
  }
}

function generateIamPolicy(
  userInfo: UserInfo,
  effect: "Allow" | "Deny",
  resource: string
): IamPolicyForPrincipal {
  return {
    principalId: userInfo.id,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Action: "execute-api:Invoke",
          Resource: resource,
        },
      ],
    },
    context: userInfo,
  };
}
