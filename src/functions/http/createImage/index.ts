import { handlerPath } from "@libs/handlerResolver";
import schema from "./schema";

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
	events: [
		{
			http: {
				method: "post",
				path: "groups/{groupId}/images",
				cors: true,
				authorizer: "auth",
				request: {
					schema: {
						"application/json": schema,
					},
				},
			},
		},
	],
};
