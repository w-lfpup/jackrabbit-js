import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { getJsonFromRequestBody } from "./flyweight.js";

export async function log(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	let message = await getRequestParams(req);
	if (!message) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}
	console.log(`[${params.title}] ${message}`);
	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<string | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { message } = json;
	if ("string" === typeof message) {
		return message;
	}
}
