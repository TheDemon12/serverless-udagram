import type { AWS } from "@serverless/typescript";

import {
	hello,
	getGroups,
	createGroup,
	getImages,
	getImage,
} from "@functions/index";

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
			IMAGES_TABLE: "Images-${self:provider.stage}",
			IMAGE_ID_INDEX: "ImageIdIndex",
		},
		lambdaHashingVersion: "20201221",
		iamRoleStatements: [
			{
				Effect: "Allow",
				Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:GetItem"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}",
			},
			{
				Effect: "Allow",
				Action: ["dynamodb:Query"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}",
			},
			{
				Effect: "Allow",
				Action: ["dynamodb:Query"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}",
			},
		],
	},

	// import the function via paths
	functions: { hello, getGroups, createGroup, getImages, getImage },

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
			ImagesDynamoDBTable: {
				Type: "AWS::DynamoDB::Table",
				Properties: {
					AttributeDefinitions: [
						{ AttributeName: "groupId", AttributeType: "S" },
						{ AttributeName: "timestamp", AttributeType: "S" },
						{ AttributeName: "imageId", AttributeType: "S" },
					],
					KeySchema: [
						{ AttributeName: "groupId", KeyType: "HASH" },
						{ AttributeName: "timestamp", KeyType: "RANGE" },
					],
					GlobalSecondaryIndexes: [
						{
							IndexName: "${self:provider.environment.IMAGE_ID_INDEX}",
							KeySchema: [{ AttributeName: "imageId", KeyType: "HASH" }],
							Projection: { ProjectionType: "ALL" },
						},
					],
					BillingMode: "PAY_PER_REQUEST",
					TableName: "${self:provider.environment.IMAGES_TABLE}",
				},
			},
		},
	},
};

module.exports = serverlessConfiguration;
