import "source-map-support/register";
import { middyfy } from "@libs/lambda";
import { DynamoDBStreamHandler } from "aws-lambda";
import { Client } from "elasticsearch";
import * as httpsAwsEs from "http-aws-es";

const esHost = process.env.ES_ENDPOINT;

const es = new Client({
	hosts: [esHost],
	connectionClass: httpsAwsEs,
});

const handler: DynamoDBStreamHandler = async (event) => {
	console.log("Processing events batch from DynamoDB", JSON.stringify(event));

	for (const record of event.Records) {
		console.log("Processing record", JSON.stringify(record));

		if (record.eventName !== "INSERT") continue;

		const newItem = record.dynamodb.NewImage;

		const imageId = newItem.imageId.S;
		const body = {
			imageId,
			groupId: newItem.groupId.S,
			imageUrl: newItem.imageUrl.S,
			title: newItem.title.S,
			timestamp: newItem.timestamp.S,
		};

		await es.index({
			index: "images-index",
			type: "images",
			id: imageId,
			body,
		});
	}
};

export const main = middyfy(handler);
