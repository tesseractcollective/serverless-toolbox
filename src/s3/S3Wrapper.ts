import { S3, AWSError } from "aws-sdk";
import { IamRoleStatement, CloudFormation } from "../awsResource";

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
export default class S3Wrapper {
  private readonly s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  private errorWrapper(
    error: AWSError,
    bucketName: string,
    action: string
  ): Promise<any> {
    // AWS doesn't namespace errors
    error.code = `S3:${error.code}`;
    error.message = `S3:${bucketName}:${action} ${error.message}`;
    return Promise.reject(error);
  }

  async get(
    bucket: string,
    key: string
  ): Promise<string | Buffer | Uint8Array | undefined> {
    return this.s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise()
      .then((object) => object.Body)
      .catch((error) => this.errorWrapper(error, bucket, "getObject"));
  }

  async getJson(bucket: string, key: string): Promise<any> {
    return this.get(bucket, key).then((body) => {
      if (body) {
        return JSON.parse(body.toString("utf8"));
      }
    });
  }

  async put(
    bucket: string,
    key: string,
    value: string | Buffer | undefined,
    contentType?: string
  ): Promise<void> {
    return this.s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: value,
        ContentType: contentType,
        CacheControl: "max-age=0",
      })
      .promise()
      .catch((error) => this.errorWrapper(error, bucket, "putObject"));
  }

  async putJson(bucket: string, key: string, value: any): Promise<void> {
    return this.put(bucket, key, JSON.stringify(value));
  }

  async delete(bucket: string, key: string): Promise<void> {
    return this.s3
      .deleteObject({
        Bucket: bucket,
        Key: key,
      })
      .promise()
      .catch((error) => this.errorWrapper(error, bucket, "deleteObject"));
  }

  async getAllKeys(
    bucket: string,
    prefix?: string,
    keys: string[] = [],
    continuationToken?: string
  ) {
    return this.s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
      .promise()
      .then((result) => {
        if (result.Contents) {
          const justKeys = result.Contents.map((object) => object.Key).filter(
            (key) => key !== undefined
          ) as string[];
          keys = keys.concat(justKeys);
        }
        if (result.ContinuationToken) {
          return this.getAllKeys(
            bucket,
            prefix,
            keys,
            result.ContinuationToken
          );
        }
        return keys;
      })
      .catch((error) => this.errorWrapper(error, bucket, "listObjectsV2"));
  }

  static iamRoleStatementForBucket = function (name: string): IamRoleStatement {
    return {
      Effect: "Allow",
      Action: [
        "s3:ListBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
      ],
      Resource: [`arn:aws:s3:::${name}`, `arn:aws:s3:::${name}/*`],
    };
  };

  static cloudFormationForBucket = function (name: string): CloudFormation {
    return {
      Type: "AWS::S3::Bucket",
      Properties: {
        BucketName: name,
      },
    };
  };
}
