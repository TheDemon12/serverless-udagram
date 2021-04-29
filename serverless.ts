import type { AWS } from "@serverless/typescript";

import {
	hello,
	getGroups,
	createGroup,
	getImages,
	getImage,
	createImage,
} from "@functions/http";
import { sendNotifications } from "@functions/s3";
import { connect, disconnect } from "@functions/webSockets";

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
			IMAGE_BUCKET: "somegram-images-${self:provider.stage}",
			CONNECTIONS_TABLE: "Connections-${self:provider.stage}",
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
				Action: ["dynamodb:Query", "dynamodb:PutItem"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}",
			},
			{
				Effect: "Allow",
				Action: ["dynamodb:Query"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}",
			},
			{
				Effect: "Allow",
				Action: ["s3:PutObject", "s3:GetObject"],
				Resource: "arn:aws:s3:::${self:provider.environment.IMAGE_BUCKET}/*",
			},
			{
				Effect: "Allow",
				Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"],
				Resource:
					"arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}",
			},
		],
	},

	// import the function via paths
	functions: {
		hello,
		getGroups,
		createGroup,
		getImages,
		getImage,
		createImage,
		sendNotifications,
		connect,
		disconnect,
	},

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
			ImageBucket: {
				Type: "AWS::S3::Bucket",
				Properties: {
					BucketName: "${self:provider.environment.IMAGE_BUCKET}",
					NotificationConfiguration: {
						LambdaConfigurations: [
							{
								Event: "s3:ObjectCreated:*",
								Function: {
									"Fn::GetAtt": ["SendNotificationsLambdaFunction", "Arn"],
								},
							},
						],
					},
					CorsConfiguration: {
						CorsRules: [
							{
								AllowedOrigins: ["*"],
								AllowedHeaders: ["*"],
								AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
								MaxAge: "3000",
							},
						],
					},
				},
			},
			ConnectionsDynamoDBTable: {
				Type: "AWS::DynamoDB::Table",
				Properties: {
					AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
					KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
					BillingMode: "PAY_PER_REQUEST",
					TableName: "${self:provider.environment.CONNECTIONS_TABLE}",
				},
			},

			SendNotificationsPermission: {
				Type: "AWS::Lambda::Permission",
				Properties: {
					FunctionName: {
						Ref: "SendNotificationsLambdaFunction",
					},
					Principal: "s3.amazonaws.com",
					Action: "lambda:InvokeFunction",
					SourceAccount: {
						Ref: "AWS::AccountId",
					},
					SourceArn: "arn:aws:s3:::${self:provider.environment.IMAGE_BUCKET}",
				},
			},

			BucketPolicy: {
				Type: "AWS::S3::BucketPolicy",
				Properties: {
					PolicyDocument: {
						Id: "MyPolicy",
						Version: "2012-10-17",
						Statement: [
							{
								Sid: "PublicReadForGetBucketObjects",
								Effect: "Allow",
								Principal: "*",
								Action: "s3:GetObject",
								Resource:
									"arn:aws:s3:::${self:provider.environment.IMAGE_BUCKET}/*",
							},
						],
					},
					Bucket: {
						Ref: "ImageBucket",
					},
				},
			},
		},
	},
};

module.exports = serverlessConfiguration;
