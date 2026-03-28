import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { jsonHeaders, getJsonFromRequestBody } from "./flyweight.js";

interface FindElementParams {
	using: "css selector";
	value: string;
	element_id: string;
}

export async function findElementsFromElement(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	if (!sessionId) return;

	let elementIds = await findElementsFromElementRequest(
		req,
		params,
		undefined,
		sessionId,
	);
	if (!elementIds) {
		res.writeHead(401);
		res.end();
		return;
	}

	res.setHeader("Content-Type", "application/json");
	res.writeHead(200);
	res.end(JSON.stringify(elementIds));
}

// need event bus to send errors to error log
async function findElementsFromElementRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string[]> {
	let { url } = params;

	let bodyJson = await getFindElementsFromElementBody(req);
	if (!bodyJson) throw new Error("Failed to deserialize FindElement body.");

	let { element_id, using, value } = bodyJson;

	let findElementRes = await fetch(
		new URL(
			new URL(`/session/${sessionId}/element/${element_id}/elements`, url),
		),
		{
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({ using, value }),
			signal,
		},
	);

	if (200 !== findElementRes.status) {
		let cause = await findElementRes.json();
		throw new Error("find-element request failed", { cause });
	}

	let json = await findElementRes.json();
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

async function getFindElementsFromElementBody(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, css_selector, element_id } = json;
	if (
		"find_elements_from_element" === type &&
		"string" === typeof css_selector &&
		"string" === typeof element_id
	) {
		return { using: "css selector", value: css_selector, element_id };
	}
}
