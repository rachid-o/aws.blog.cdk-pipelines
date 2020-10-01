import {AssetCode, Function, Runtime} from "@aws-cdk/aws-lambda"
import {CfnOutput, Duration, Stack, StackProps} from '@aws-cdk/core';
import {Construct} from "@aws-cdk/core/lib/construct-compat";
import {LambdaIntegration, RestApi} from "@aws-cdk/aws-apigateway"

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
  }
}