import {Repository} from "@aws-cdk/aws-codecommit";
import {Artifact} from "@aws-cdk/aws-codepipeline";
import {CdkPipeline, ShellScriptAction, SimpleSynthAction} from "@aws-cdk/pipelines";
import {CodeCommitSourceAction, ManualApprovalAction} from "@aws-cdk/aws-codepipeline-actions";
import {CfnOutput, Construct, Stack, StackProps, Stage, StageProps} from "@aws-cdk/core";
import {AwsBlogLambdaStack} from "./aws.blog-lambda-stack";


export class AwsBlogApplicationStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id);
    const lambdaStack = new AwsBlogLambdaStack(this, 'AwsBlogLambdaStack');
    this.urlOutput = lambdaStack.urlOutput;
  }
}


export class AwsBlogCdkPipelinesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const repoName = "aws.blog.cdk-pipelines";	// Change this to the name of your repo
    const repo = Repository.fromRepositoryName(this, 'ImportedRepo', repoName);

    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'AwsBlogCdkPipeline',
      cloudAssemblyArtifact,

      // Here we use CodeCommit instead of Github
      sourceAction: new CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: repo,
        output: sourceArtifact
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        // Use this if you need a build step (if you're not using ts-node
        // or if you have TypeScript Lambdas that need to be compiled).
        buildCommand: 'npm run build && npm run test',
      }),
    });


    // Here we will add the stages for the Application code later

    let testEnv = new AwsBlogApplicationStage(this, 'Test-env');
    const testEnvStage = pipeline.addApplicationStage(testEnv);


    testEnvStage.addActions(
        // Add automated verification step in our pipeline
        new ShellScriptAction({
          actionName: 'SmokeTest',
          useOutputs: {
            ENDPOINT_URL: pipeline.stackOutput(testEnv.urlOutput),
          },
          commands: ['curl -Ssf $ENDPOINT_URL'],
          runOrder: testEnvStage.nextSequentialRunOrder(),
        }),
        // Add manual verification step in our pipeline
        new ManualApprovalAction({
          actionName: 'ManualApproval',
          externalEntityLink: pipeline.stackOutput(testEnv.urlOutput).outputName,
          runOrder: testEnvStage.nextSequentialRunOrder(),
        })
    );

    // Deploy to the Production environment
    let prodEnv = new AwsBlogApplicationStage(this, 'Prod-env');
    const prodStage = pipeline.addApplicationStage(prodEnv);
    // Extra check to be sure that the deployment to Prod was successful
    prodStage.addActions(new ShellScriptAction({
      actionName: 'SmokeTest',
      useOutputs: {
        ENDPOINT_URL: pipeline.stackOutput(prodEnv.urlOutput),
      },
      commands: ['curl -Ssf $ENDPOINT_URL'],
    }));

  }
}

