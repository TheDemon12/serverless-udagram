import "source-map-support/register";

import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

const imagesTable = process.env.IMAGES_TABLE;
const imageIdIndex = process.env.IMAGE_ID_INDEX;
const docClient = new DocumentClient();

const hello: APIGatewayProxyHandler = async (event) => {
	const imageId = event.pathParameters.imageId;

	const result = await docClient
		.query({
			TableName: imagesTable,
			IndexName: imageIdIndex,
			KeyConditionExpression: "imageId = :imageId",
			ExpressionAttributeValues: {
				":imageId": imageId,
			},
		})
		.promise();

	if (result.Count === 0)
		return formatJSONResponse(
			{
				error: "Image does not exist!",
			},
			404
		);

	return formatJSONResponse(
		{
			items: result.Items[0],
		},
		404
	);
};

export const main = middyfy(hello);
