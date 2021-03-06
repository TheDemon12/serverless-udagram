import { getUserId } from "./../../auth/utils";

import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import * as uuid from "uuid";

import schema from "./schema";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const groupsTable = process.env.GROUPS_TABLE;
const docClient = new DocumentClient();

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
	event
) => {
	const itemId = uuid.v4();
	const body = event.body;

	const authorizationHeader = event.headers.Authorization;
	const jwtToken = authorizationHeader.split(" ")[1];

	const userId = getUserId(jwtToken);

	const newItem = {
		id: itemId,
		userId,
		...body,
	};

	await docClient
		.put({
			TableName: groupsTable,
			Item: newItem,
		})
		.promise();

	return formatJSONResponse(
		{
			message: `inserted new item successfully!`,
			newItem,
		},
		201
	);
};

export const main = middyfy(hello);
