import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { WebdriverParams } from "../config.js";

import { getJsonFromRequestBody } from "./flyweight.js";

export async function log(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	let message = await getLogBody(req);
	if (!message) {
		res.writeHead(401);
		res.end();
		return;
	}
	console.log(`[${params.title}] ${message}`);
	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getLogBody(req: IncomingMessage): Promise<string | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, message } = json;
	if ("log" === type && "string" === typeof message) {
		return message;
	}
}
