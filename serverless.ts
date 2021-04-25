import type { AWS } from "@serverless/typescript";

import { hello, groups } from "@functions/index";

const serverlessConfiguration: AWS = {
	service: "somegram",
	frameworkVersion: "2",
	custom: {
		webpack: {
			webpackConfig: "./webpack.config.js",
			includeModules: true,
		},
	},
	plugins: ["serverless-webpack"],
	provider: {
		name: "aws",
		runtime: "nodejs14.x",
		stage: "${opt:stage, 'dev'}",
		// @ts-ignore
		region: "${opt:region, 'ap-south-1'}",
		apiGateway: {
			minimumCompressionSize: 1024,
			shouldStartNameWithService: true,
		},
		environment: {
			AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
			GROUPS_TABLE: "Groups-${self:provider.stage}",
		},
		lambdaHashingVersion: "20201221",
		iamRoleStatements: [
			{
				Effect: "Allow",
				Action: ["dynamodb:Scan"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}",
			},
		],
	},

	// import the function via paths
	functions: { hello, groups },

	resources: {
		Resources: {
			GroupsDynamoDBTable: {
				Type: "AWS::DynamoDB::Table",
				Properties: {
					AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
					KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
					BillingMode: "PAY_PER_REQUEST",
					TableName: "${self:provider.environment.GROUPS_TABLE}",
				},
			},
		},
	},
};

module.exports = serverlessConfiguration;
