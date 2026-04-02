import type { IncomingMessage } from "http";
import type { FindElementFromShadowRootParams } from "../../../browser/dist/mod.js";

import {
	headers,
	getJsonFromRequestBody,
	ActionParams,
	dispatchSessionError,
} from "../flyweight.js";

export async function findElementFromShadowRoot(actionParams: ActionParams) {
	let { req, res } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let elementId = await findElementFromShadowRootRequest(
		actionParams,
		reqParams,
	);
	if (!elementId) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end(elementId);
}

async function findElementFromShadowRootRequest(
	actionParams: ActionParams,
	reqParams: FindElementFromShadowRootParams,
): Promise<string | undefined> {
	let { webdriverParams, sessionId, signal, eventbus } = actionParams;
	let { webdriverUrl, jackrabbitId } = webdriverParams;
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

	if (404 === response.status) return;

	if (200 !== response.status) {
		let reason = await response.json();
		let cause = `Find-element-from-shadow-root webdriver request failed: ${reason}`;
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	let json = await response.json();
	if (json && "object" !== typeof json.value) {
		let cause = "Find-element-from-shadow-root return value is not an object.";
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

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
