import {AssetCode, Function, Runtime} from "@aws-cdk/aws-lambda"
import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from '@aws-cdk/core';
import {Construct} from "@aws-cdk/core/lib/construct-compat";
import {LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway"
import cdk = require('@aws-cdk/core');
import {Bucket} from "@aws-cdk/aws-s3";
import cloudfront = require('@aws-cdk/aws-cloudfront');

export class AwsBlogLambdaStack extends Stack {
  public readonly urlOutput: CfnOutput;

  constructor(app: Construct, id: string, props?: StackProps) {
    super(app, id, props);

    // Configure the lambda
    const lambdaFunc = new Function(this, 'BlogLambda', {
      code: new AssetCode(`./src`),
      handler: 'greeting.handler',
      runtime: Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        DEPLOY_TIME: new Date().toISOString()   // Example of how we can pass variables to the deployed lambda
      },
    });

    // Configure API in API Gateway
    const api = new RestApi(this, 'blog-greetingsApi', {
      restApiName: 'Greeting Service'
    });
    // Integration with the lambda on GET method
    api.root.addMethod('GET', new LambdaIntegration(lambdaFunc));

    // Make the URL part of the outputs of CloudFormation (see the Outputs tab of this stack in the AWS Console)
    this.urlOutput = new CfnOutput(this, 'Url', { value: api.url, });


    let bucketName
    // Content bucket
    const websiteBucket = new Bucket(this, 'SiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,

      // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
      // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
      // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    });
    new CfnOutput(this, 'BUCKET_NAME', { value: websiteBucket.bucketName });
    new cdk.CfnOutput(this, 'BUCKET_URL', {
      description: 'The URL of the website',
      value: websiteBucket.bucketWebsiteUrl
    });


    // CloudFront distribution that provides HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      // aliasConfiguration: {
      //     acmCertRef: certificateArn,
      //     names: [ siteDomain ],
      //     sslMethod: cloudfront.SSLMethod.SNI,
      //     securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      // },
      // originConfigs: [
      //   {
      //     s3OriginSource: {
      //       s3BucketSource: websiteBucket
      //     },
      //     behaviors : [ {isDefaultBehavior: true}]
      //   }
      // ],
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket
          },
          behaviors : [ {isDefaultBehavior: true}],
        }
      ]
    });
    new cdk.CfnOutput(this, 'Domain name', { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

  }
}
