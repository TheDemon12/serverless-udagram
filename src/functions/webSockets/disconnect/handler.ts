import "source-map-support/register";

import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
	APIGatewayProxyEvent,
	APIGatewayProxyHandler,
	APIGatewayProxyResult,
} from "aws-lambda";

const connectionsTable = process.env.CONNECTIONS_TABLE;
const docClient = new DocumentClient();

const handler: APIGatewayProxyHandler = async (
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
	const connectionId = event.requestContext.connectionId;

	await docClient
		.delete({
			TableName: connectionsTable,
			Key: {
				id: connectionId,
			},
		})
		.promise();

	return formatJSONResponse({}, 200);
};

export const main = middyfy(handler);
