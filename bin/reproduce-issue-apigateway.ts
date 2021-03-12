#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ReproduceIssueApigatewayStack } from '../lib/reproduce-issue-apigateway-stack';

const app = new cdk.App();
new ReproduceIssueApigatewayStack(app);
