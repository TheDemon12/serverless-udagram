import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import * as uuid from "uuid";

import schema from "./schema";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { S3 } from "aws-sdk";
const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const bucketName = process.env.IMAGE_BUCKET;

const docClient = new DocumentClient();

const s3 = new S3({
	signatureVersion: "v4",
});

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
		imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`,
		...body,
	};

	await docClient
		.put({
			TableName: imagesTable,
			Item: newImage,
		})
		.promise();

	const url = await getUploadUrl(imageId);

	return formatJSONResponse(
		{
			message: `added new image successfully!`,
			newImage,
			uploadUrl: url,
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

function getUploadUrl(imageId: string): string {
	return s3.getSignedUrl("putObject", {
		Bucket: bucketName,
		Key: imageId,
		Expires: 3000,
	});
}

export const main = middyfy(hello);
