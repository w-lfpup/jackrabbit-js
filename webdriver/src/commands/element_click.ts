import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";
import type { ElementClickParams } from "../../../browser/dist/mod.js";

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
	if (!elementId) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let response = await fetch(
		new URL(`/session/${sessionId}/element/${elementId}/click`, url),
		{
			method: "POST",
			headers,
			body: JSON.stringify({}),
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

async function getElementIdFromRequest(
	req: IncomingMessage,
): Promise<ElementClickParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let element_id = json?.element_id;
	if ("string" === typeof element_id) {
		return { element_id };
	}
}
