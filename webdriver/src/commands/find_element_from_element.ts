import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

interface FindElementParams {
	using: "css selector";
	value: string;
	element_id: string;
}

export async function findElementFromElement(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	if (!sessionId) return;

	let elementId = await findElementFromElementRequest(
		req,
		params,
		undefined,
		sessionId,
	);
	if (!elementId) {
		res.writeHead(401);
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.write(elementId);
	res.end();
}

// need event bus to send errors to error log
async function findElementFromElementRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { url } = params;

	let reqParams = await getRequestParams(req);
	if (!reqParams) throw new Error("Failed to deserialize find-element-from-element body.");

	let { element_id, using, value } = reqParams;

	let response = await fetch(
		new URL(
			new URL(`/session/${sessionId}/element/${element_id}/element`, url),
		),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ using, value }),
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("find-element-from-element request failed", { cause });
	}

	let json = await response.json();
	if ("object" !== typeof json?.value)
		throw new Error("find-element-from-element return value is not an object");

	if (json.value instanceof Object) {
		for (let [key, value] of Object.entries(json.value)) {
			if (
				"string" === typeof key &&
				"string" === typeof value &&
				key.startsWith("element-")
			)
				// return key;
				return value;
		}
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, css_selector, element_id } = json;
	if ("string" === typeof css_selector && "string" === typeof element_id) {
		return { using: "css selector", value: css_selector, element_id };
	}
}
