import { handlerPath } from "@libs/handlerResolver";

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
	environment: {
		API_ID: {
			Ref: "WebsocketsApi",
		},
		STAGE: "${self:provider.stage}",
	},
};
