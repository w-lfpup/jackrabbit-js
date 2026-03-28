import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { getJsonFromRequestBody, jsonHeaders } from "./flyweight.js";

export async function getElementShadowRoot(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined, // driver defined state
	params: WebdriverParams,
	sessionId: string | undefined,
) {
	let elementId = await getElementShadowRootRequest(
		req,
		signal,
		params,
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

async function getElementShadowRootRequest(
	req: IncomingMessage,
	signal: AbortSignal | undefined, // driver defined state
	params: WebdriverParams, // driver defined state
	sessionId: string | undefined, // derived state associated with driver
): Promise<string | undefined> {
	let { url } = params;

	if (!sessionId) return;

	let elementId = await getElementShadowRootBody(req);
	if (!elementId)
		throw new Error("Failed to deserialize GetElementShadowRoot body.");

	let response = await fetch(
		new URL(new URL(`/session/${sessionId}/element/${elementId}/shadow`, url)),
		{
			method: "GET",
			headers: jsonHeaders,
			signal,
		},
	);

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("find-element request failed", { cause });
	}

	let json = await response.json();
	if ("object" !== typeof json?.value)
		throw new Error("GetElementShadowRoot return value is not an object");

	for (let [key, value] of Object.entries(json.value)) {
		if (
			"string" === typeof key &&
			"string" === typeof value &&
			key.startsWith("shadow-")
		)
			return value;
	}
}

async function getElementShadowRootBody(
	req: IncomingMessage,
): Promise<string | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, element_id } = json;
	if ("get_element_shadow_root" === type && "string" === typeof element_id) {
		return element_id;
	}
}
