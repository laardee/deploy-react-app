import {
  Stack,
  StackProps,
  aws_s3,
  aws_cloudfront,
  Duration,
  aws_cloudfront_origins,
  aws_s3_deployment,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a bucket
    const bucket = new aws_s3.Bucket(this, "FrontendBucket", {
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
    });

    // Create a CloudFront Distribution
    const distribution = new aws_cloudfront.Distribution(
      this,
      "FrontendCloudFront",
      {
        enableIpv6: true,
        comment: "React deployment example",
        defaultRootObject: "index.html",
        minimumProtocolVersion:
          aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        defaultBehavior: {
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          origin: new aws_cloudfront_origins.S3Origin(bucket),
        },
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(0),
          },
        ],
      }
    );

    // Deploy the react app to S3
    new aws_s3_deployment.BucketDeployment(this, "FrontendDeployment", {
      sources: [aws_s3_deployment.Source.asset("../client/build")],
      destinationBucket: bucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    });

    // Output distribution domain name
    new CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });
  }
}
