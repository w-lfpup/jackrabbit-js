import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

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
	sessionId: string,
) {
	let elementIds = await findElementsRequest(req, params, undefined, sessionId);
	if (!elementIds) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.setHeader("Content-Type", "application/json");
	res.writeHead(200);
	res.end(JSON.stringify(elementIds));
}

async function findElementsRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string[]> {
	let { url } = params;

	let reqParams = await getRequestParams(req);
	if (!reqParams) throw new Error("Failed to deserialize FindElements body.");

	let response = await fetch(
		new URL(new URL(`/session/${sessionId}/elements`, url)),
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
	if (!Array.isArray(json?.value))
		throw new Error("getElements return value is not an array");

	let elementIds = [];
	for (let elObj of json.value) {
		if (typeof elObj === "object") {
			for (let [elHash, elId] of Object.entries(elObj)) {
				if (
					"string" === typeof elHash &&
					"string" === typeof elId &&
					elHash.startsWith("element-")
				) {
					elementIds.push(elId);
				}
			}
		}
	}

	return elementIds;
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
