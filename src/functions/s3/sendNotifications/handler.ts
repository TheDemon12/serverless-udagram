import { middyfy } from "@libs/lambda";
import { S3Event, S3Handler } from "aws-lambda";
import { ApiGatewayManagementApi, DynamoDB } from "aws-sdk";

const apiID = process.env.API_ID;
const stage = process.env.STAGE;

const connectionsTable = process.env.CONNECTIONS_TABLE;
const docClient = new DynamoDB.DocumentClient();

const connectionParams = {
	apiVersion: "2020-04-29",
	endpoint: `${apiID}.execute-api.ap-south-1.amazonaws.com/${stage}`,
};

const apiGateway = new ApiGatewayManagementApi(connectionParams);

const handler: S3Handler = async (event: S3Event) => {
	for (const record of event.Records) {
		const key = record.s3.object.key;
		console.log("Processing S3 item with key: ", key);

		const connections = await docClient
			.scan({
				TableName: connectionsTable,
			})
			.promise();

		for (let connection of connections.Items) {
			const connectionId = connection.id;

			await sendMessageToClient(connectionId, {
				imageId: key,
			});
		}
	}
};

async function sendMessageToClient(connectionId: string, payload) {
	try {
		console.log("Sending message to connection", connectionId);

		await apiGateway
			.postToConnection({
				ConnectionId: connectionId,
				Data: JSON.stringify(payload),
			})
			.promise();
	} catch (ex) {
		console.log("Failed to send message", JSON.stringify(ex));

		if (ex.statusCode === 410) {
			console.log("Stale Connection");

			await docClient
				.delete({
					TableName: connectionsTable,
					Key: {
						id: connectionId,
					},
				})
				.promise();
		}
	}
}

export const main = middyfy(handler);
