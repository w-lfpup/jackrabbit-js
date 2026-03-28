import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { jsonHeaders, getJsonFromRequestBody } from "./flyweight.js";

export async function elementClick(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url } = params;

	let elementId = await getElementClickBody(req);
	if (!elementId) throw new Error("Failed to deserialize ElementClick body.");

	let resposne = await fetch(
		new URL(`/session/${sessionId}/element/${elementId}/click`, url),
		{
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({}),
			signal,
		},
	);

	if (200 !== resposne.status) {
		let cause = await resposne.json();
		throw new Error("element-click request failed", { cause });
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getElementClickBody(
	req: IncomingMessage,
): Promise<string | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, element_id } = json;
	if ("element_click" === type && "string" === typeof element_id) {
		return element_id;
	}
}
