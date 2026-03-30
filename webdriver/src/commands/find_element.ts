import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

interface FindElementParams {
	using: "css selector";
	value: string;
}

export async function findElement(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	if (!sessionId) return;

	let elementId = await findElementRequest(req, params, signal, sessionId);
	if (!elementId) {
		res.writeHead(401);
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.write(elementId);
	res.end();
}

async function findElementRequest(
	req: IncomingMessage,
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	sessionId: string,
): Promise<string | undefined> {
	let { url } = params;

	let reqParams = await getRequestParams(req);
	if (!reqParams) throw new Error("Failed to deserialize FindElement body.");

	let response = await fetch(
		new URL(new URL(`/session/${sessionId}/element`, url)),
		{
			method: "POST",
			headers,
			body: JSON.stringify(reqParams),
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("find-element request failed", { cause });
	}

	let json = await response.json();
	if ("object" !== typeof json?.value)
		throw new Error("find-element return value is not an object");

	for (let [elHash, elId] of Object.entries(json.value)) {
		if ("string" === typeof elId && elHash.startsWith("element-")) return elId;
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { css_selector } = json;
	if ("string" === typeof css_selector) {
		return { using: "css selector", value: css_selector };
	}
}
