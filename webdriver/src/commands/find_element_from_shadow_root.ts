import type { IncomingMessage, ServerResponse } from "http";
import type { WebdriverParams } from "../config.js";

import { headers, getJsonFromRequestBody } from "./flyweight.js";

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
	let elementId = await findElementFromShadowRootRequest(
		req,
		params,
		signal,
		sessionId,
	);
	if (!elementId) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end(elementId);
}

// need event bus to send errors to error log
async function findElementFromShadowRootRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { url } = params;

	let reqParams = await getRequestParams(req);
	if (!reqParams)
		throw new Error(
			"Failed to deserialize find-element-from-shadow-root body.",
		);

	let { shadow_root_id, using, value } = reqParams;

	let response = await fetch(
		new URL(
			new URL(`/session/${sessionId}/shadow/${shadow_root_id}/element`, url),
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
		throw new Error("Find-element-from-shadow-root request failed.", { cause });
	}

	let json = await response.json();
	if ("object" !== typeof json?.value)
		throw new Error(
			"Find-element-from-shadow-root return value is not an object.",
		);

	if (json.value instanceof Object) {
		for (let [elHash, id] of Object.entries(json.value)) {
			if (
				"string" === typeof elHash &&
				"string" === typeof id &&
				elHash.startsWith("element-")
			)
				return id;
		}
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let { css_selector, shadow_root_id } = await getJsonFromRequestBody(req);
	if ("string" === typeof css_selector && "string" === typeof shadow_root_id) {
		return { using: "css selector", value: css_selector, shadow_root_id };
	}
}
