import { middyfy } from "@libs/lambda";
import {
	APIGatewayAuthorizerHandler,
	APIGatewayAuthorizerResult,
	APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

import { verify } from "jsonwebtoken";
import { JwtToken } from "./index";

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJYjrEZqMTMRkjMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1nZzl6MHk3aS51cy5hdXRoMC5jb20wHhcNMjAwNjIyMDcwODE3WhcN
MzQwMzAxMDcwODE3WjAkMSIwIAYDVQQDExlkZXYtZ2c5ejB5N2kudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsQIYCy48jwMOBt3z
GmUlcqRCk33t8rzyG+Knep4mwjdaNDK/7U1r67bmuBnBSY/Xn6LgeKHDtQo1dpJL
IbjjfPnzYWhHd1ckQ2/TaYcDkKjDW3zzWMPOoJxK1BmzIl30QsRmt802kyoqWOtT
kjV9jC2Y4eMIqQ9h366V27GFlRecJCkZ2F6IMeM2ZJm2Z5FXBI+/NGJnmy2nNNEW
mEHZWYlIAwf9KLQl2lNXQc0Vipr3H7D+rqkkVM+GNMSVYGCYC/H9DZdZYCVfbcLk
h+0E1LByIcBco/JuYfV0f9u0DJk5qo7cmXWk8AtjBZ0KiDxQ/1jqOpFCw3lOrzMr
uSi2RQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRBvJE13UpU
wx8cGww8BWtl2qPsAjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AH27OXMHekWcPujYAcP849ItFl++1PYIXCnrgeQQu6ny7jAk3ueImZpGBkwSdcze
aJmz66wOx2IU9MWFSIBAEkvHl//8RPL73AgJv5z2BJIo1qU5pENyb4h03dWe/+jq
SsPs15ehX7kkxByyGKjz6rSl+mfNeZnCIKYSm76nAtv8XZRWCWHPU/+DG/4spb1m
l8IwUTg7DOOwyikliV612fN86gIlAdh7AX4z5VHovXwYOfFF6RoYka6VIA4IsyQX
zbCfzNCS0eus1DkbS5xjfBiUx+StNiidfc94pVqcOQci2hfc2+UZJ7i6oU4JMADB
ullfBJlbcCVesafJBrUuWcU=
-----END CERTIFICATE-----`;

const handler: APIGatewayAuthorizerHandler = async (
	event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
	try {
		const decodedToken = await verifyToken(event.authorizationToken);
		return {
			principalId: decodedToken.sub,
			policyDocument: {
				Version: "2012-10-17",
				Statement: [
					{ Action: "execute-api:Invoke", Effect: "Allow", Resource: "*" },
				],
			},
		};
	} catch (ex) {
		console.log(ex.message);
		return {
			principalId: "user",
			policyDocument: {
				Version: "2012-10-17",
				Statement: [
					{ Action: "execute-api:Invoke", Effect: "Deny", Resource: "*" },
				],
			},
		};
	}
};

const verifyToken = async (authHeader: string) => {
	if (!authHeader) throw new Error("No Authorization header!");

	if (!authHeader.toLowerCase().startsWith("bearer "))
		throw new Error("Invalid Authorization header!");

	const token = authHeader.split(" ")[1];

	// return verify(token, secret) as JwtToken;
	return verify(token, cert, { algorithms: ["RS256"] }) as JwtToken;
};

export const main = middyfy(handler);
