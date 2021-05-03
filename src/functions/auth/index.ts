import { handlerPath } from "@libs/handlerResolver";

export interface JwtToken {
	iss: string;
	sub: string;
	iat: number;
	exp: number;
}

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
};
