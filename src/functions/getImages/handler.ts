import "source-map-support/register";

import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const docClient = new DocumentClient();

const hello: APIGatewayProxyHandler = async (event) => {
	const groupId = event.pathParameters.groupId;

	if (!(await doGroupExist(groupId)))
		return formatJSONResponse(
			{
				error: "Group does not exist!",
			},
			404
		);

	const images = await getImagesPerGroup(groupId);

	return formatJSONResponse(
		{
			items: images,
		},
		200
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

async function getImagesPerGroup(groupId: string) {
	const result = await docClient
		.query({
			TableName: imagesTable,
			KeyConditionExpression: "groupId = :groupId",
			ExpressionAttributeValues: {
				":groupId": groupId,
			},
			ScanIndexForward: false,
		})
		.promise();

	return result.Items;
}

export const main = middyfy(hello);
