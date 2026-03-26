import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { WebdriverParams } from "../config.js";

import { jsonHeaders, getJsonFromRequestBody } from "./flyweight.js";

interface FindElementParams {
	using: "css selector";
	value: string;
	shadow_root_id: string;
}

export async function findElementFromShadowRoot(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	if (!sessionId) return;

	let elementId = await findElementFromShadowRootRequest(req, params, undefined, sessionId);
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
async function findElementFromShadowRootRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { url } = params;

	let bodyJson = await getFindElementFromShadowRootBody(req);
	if (!bodyJson) throw new Error("Failed to deserialize FindElement body.");

	let {shadow_root_id, using, value} = bodyJson;
	
	let findElementRes = await fetch(
		new URL(new URL(`/session/${sessionId}/shadow/${shadow_root_id}/element`, url)),
		{
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({ using, value}),
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

async function getFindElementFromShadowRootBody(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, css_selector, shadow_root_id } = json;
	if ("find_element_from_shadow_root" === type && "string" === typeof css_selector && "string" === typeof shadow_root_id) {
		return { using: "css selector", value: css_selector, shadow_root_id };
	}
}
