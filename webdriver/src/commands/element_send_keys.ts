import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";
import type { ElementSendKeysParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

export async function elementSendKeys(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url } = params;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let { element_id, text } = reqParams;

	let response = await fetch(
		new URL(`/session/${sessionId}/element/${element_id}/value`, url),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ text }),
			signal,
		},
	);

	if (200 === response.status) {
		res.writeHead(200, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(404, { "content-type": "text/plain" });
	res.end();
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<ElementSendKeysParams | undefined> {
	let { element_id, text } = await getJsonFromRequestBody(req);
	if ("string" === typeof element_id && "string" === typeof text) {
		return { element_id, text };
	}
}
