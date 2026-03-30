import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

export async function elementSendKeys(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url } = params;

	let reqParams = await getElementSendKeysBody(req);
	if (!reqParams)
		throw new Error("Failed to deserialize ElementSendKeys body.");

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

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("element-send-keys request failed", { cause });
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

interface ElementSendKeysParams {
	text: string;
	element_id: string;
}

async function getElementSendKeysBody(
	req: IncomingMessage,
): Promise<ElementSendKeysParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { element_id, text } = json;
	if ("string" === typeof element_id && "string" === typeof text) {
		return { element_id, text };
	}
}
