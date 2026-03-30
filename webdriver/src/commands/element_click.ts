import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

export async function elementClick(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url } = params;

	let elementId = await getElementIdFromRequest(req);
	if (!elementId) throw new Error("Failed to deserialize element-click body.");

	let response = await fetch(
		new URL(`/session/${sessionId}/element/${elementId}/click`, url),
		{
			method: "POST",
			headers,
			body: JSON.stringify({}),
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("Element-click request failed", { cause });
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getElementIdFromRequest(
	req: IncomingMessage,
): Promise<string | undefined> {
	let json = await getJsonFromRequestBody(req);
	let element_id = json?.element_id;
	if ("string" === typeof element_id) {
		return element_id;
	}
}
