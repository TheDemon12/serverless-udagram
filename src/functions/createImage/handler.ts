import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import * as uuid from "uuid";

import schema from "./schema";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const docClient = new DocumentClient();

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
	event
) => {
	const imageId = uuid.v4();
	const groupId = event.pathParameters.groupId;

	if (!(await doGroupExist(groupId)))
		return formatJSONResponse(
			{
				error: "Group does not exist!",
			},
			404
		);

	const body = event.body;

	const newImage = {
		imageId,
		groupId,
		timestamp: new Date().toISOString(),
		...body,
	};

	await docClient
		.put({
			TableName: imagesTable,
			Item: newImage,
		})
		.promise();

	return formatJSONResponse(
		{
			message: `added new image successfully!`,
			newImage,
		},
		201
	);
};

async function doGroupExist(groupId: string): Promise<boolean> {
	const result = await docClient
		.get({
			TableName: groupsTable,
			Key: {
				id: groupId,
			},
		})
		.promise();

	return !!result.Item;
}

export const main = middyfy(hello);
