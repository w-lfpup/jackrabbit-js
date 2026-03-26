import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { WebdriverParams } from "../config.js";

import { jsonHeaders, getJsonFromRequestBody } from "./flyweight.js";

interface FindElementParams {
	using: "css selector";
	value: string;
}

// FIND ELEMENTS
export async function findElements(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined, // driver defined state
	params: WebdriverParams,
	sessionId: string | undefined,
) {
	if (!sessionId) return;

	let elementIds = await findElementsRequest(req, params, undefined, sessionId);
	if (!elementIds) {
		res.writeHead(401);
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "application/json" });
	res.write(elementIds);
	res.end();
}

async function findElementsRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string[]> {
	let { url } = params;

	let bodyJson = await getFindElementsBody(req);
	if (!bodyJson) throw new Error("Failed to deserialize FindElement body.");

	let findElementRes = await fetch(
		new URL(new URL(`/session/${sessionId}/elements`, url)),
		{
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(bodyJson),
			signal,
		},
	);

	if (200 !== findElementRes.status) {
		let cause = await findElementRes.json();
		throw new Error("find-element request failed", { cause });
	}

	let json = await findElementRes.json();
	if ("object" !== typeof json?.value)
		throw new Error("getElements return value is not an object");

	let elementIds = [];
	for (let [key, value] of Object.entries(json.value)) {
		if (
			"string" === typeof key &&
			"string" === typeof value &&
			key.startsWith("element-")
		)
			elementIds.push(value);
	}

	return elementIds;
}

async function getFindElementsBody(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, css_selector } = json;
	if ("find_elements" === type && "string" === typeof css_selector) {
		return { using: "css selector", value: css_selector };
	}
}
