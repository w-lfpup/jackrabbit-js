import type { IncomingMessage } from "http";
import type { LogParams } from "../../../browser/dist/mod.js";

import { getJsonFromRequestBody, ActionParams } from "./flyweight.js";

export async function log(actionParams: ActionParams) {
	let { req, res, webdriverParams } = actionParams;
	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let { message } = reqParams;
	console.log(`[${webdriverParams.title}] ${message}`);
	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<LogParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { message } = json;
	if ("string" === typeof message) {
		return { message };
	}
}
