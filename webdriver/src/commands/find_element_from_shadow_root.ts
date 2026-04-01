import type { IncomingMessage } from "http";
import type { WebdriverParams } from "../config.js";
import type { FindElementFromShadowRootParams } from "../../../browser/dist/mod.js";

import { headers, getJsonFromRequestBody, ActionParams } from "../flyweight.js";

export async function findElementFromShadowRoot(actionParams: ActionParams) {
	let { req, res, eventbus, signal, webdriverParams, sessionId } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	// send error through event bus
	let elementId = await findElementFromShadowRootRequest(
		webdriverParams,
		reqParams,
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
	params: WebdriverParams, // driver defined state
	reqParams: FindElementFromShadowRootParams,
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { webdriverUrl } = params;

	let { css_selector, shadow_root_id } = reqParams;

	let response = await fetch(
		new URL(
			new URL(
				`/session/${sessionId}/shadow/${shadow_root_id}/element`,
				webdriverUrl,
			),
		),
		{
			method: "POST",
			headers,
			body: JSON.stringify({ using: "css selector", value: css_selector }),
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
			if ("string" === typeof id && elHash.startsWith("element-")) return id;
		}
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<FindElementFromShadowRootParams | undefined> {
	let { css_selector, shadow_root_id } = await getJsonFromRequestBody(req);
	if ("string" === typeof css_selector && "string" === typeof shadow_root_id) {
		return { css_selector, shadow_root_id };
	}
}
