import { decode } from "jsonwebtoken";
import { JwtToken } from "./index";

export const getUserId = (token: string) => {
	const decodedJwt = decode(token) as JwtToken;
	return decodedJwt.sub;
};
