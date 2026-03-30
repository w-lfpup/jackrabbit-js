import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";
import type { LogParams } from "../../../browser/dist/mod.js";

import { getJsonFromRequestBody } from "./flyweight.js";

export async function log(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let { message } = reqParams;
	console.log(`[${params.title}] ${message}`);
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
