import "source-map-support/register";

import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const groupsTable = process.env.GROUPS_TABLE;
const docClient = new DynamoDB.DocumentClient();

const handler: APIGatewayProxyHandler = async () => {
	const result = await docClient.scan({ TableName: groupsTable }).promise();
	console.log(result);
	return formatJSONResponse({
		groups: result.Items,
	});
};

export const main = middyfy(handler);
