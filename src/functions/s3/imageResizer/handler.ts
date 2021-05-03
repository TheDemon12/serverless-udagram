import { middyfy } from "@libs/lambda";
import { S3Event, SNSHandler } from "aws-lambda";
import Jimp from "jimp";
import { S3 } from "aws-sdk";

const thumbnailsBucket = process.env.THUMBNAIL_IMAGE_BUCKET;
const imagesBucket = process.env.IMAGE_BUCKET;

const s3Client = new S3({
	region: "ap-south-1",
});

const handler: SNSHandler = async (event) => {
	for (const snsRecord of event.Records) {
		const S3Event: S3Event = JSON.parse(snsRecord.Sns.Message);

		await processS3Event(S3Event);
	}
};

const processS3Event = async (event: S3Event) => {
	for (const record of event.Records) {
		const imageId = record.s3.object.key;

		const { Body } = await s3Client
			.getObject({
				Bucket: imagesBucket,
				Key: imageId,
			})
			.promise();

		const image = await Jimp.read(Body as Buffer);
		image.resize(150, Jimp.AUTO);

		const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);

		await s3Client
			.putObject({
				Bucket: thumbnailsBucket,
				Key: `${imageId}.jpeg`,
				Body: buffer,
			})
			.promise();
	}
};

export const main = middyfy(handler);
