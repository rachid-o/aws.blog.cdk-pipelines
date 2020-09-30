#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsBlogCdkPipelinesStack } from '../lib/aws.blog.cdk-pipelines-stack';

const app = new cdk.App();
new AwsBlogCdkPipelinesStack(app, 'AwsBlogCdkPipelinesStack');
