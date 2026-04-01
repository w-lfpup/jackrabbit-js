import type { IncomingMessage } from "http";
import type { WebdriverParams } from "../config.js";
import type { GetElementShadowRootParams } from "../../../browser/dist/mod.js";

import {
	getJsonFromRequestBody,
	headers,
	ActionParams,
	dispatchSessionError,
} from "../flyweight.js";
import { EventBusInterface } from "../eventbus.js";

export async function getElementShadowRoot(actionParams: ActionParams) {
	let { req, res } = actionParams;

	let reqParams = await getRequestParams(req);
	if (!reqParams) {
		res.writeHead(400, { "content-type": "text/plain" });
		res.end();
		return;
	}

	let elementId = await getElementShadowRootRequest(actionParams, reqParams);
	if (!elementId) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end();
		return;
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.write(elementId);
	res.end();
}

async function getElementShadowRootRequest(
	actionParams: ActionParams,
	reqParams: GetElementShadowRootParams,
): Promise<string | undefined> {
	let { webdriverParams, sessionId, signal, eventbus } = actionParams;
	let { webdriverUrl, jackrabbitId } = webdriverParams;
	let { element_id } = reqParams;

	let response = await fetch(
		new URL(
			new URL(
				`/session/${sessionId}/element/${element_id}/shadow`,
				webdriverUrl,
			),
		),
		{
			method: "GET",
			headers,
			signal,
		},
	);

	if (404 === response.status) return;

	if (200 !== response.status) {
		let reason = await response.json();
		let cause = `Find-element webdriver request failed: ${reason}`;
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	let json = await response.json();
	if (json && "object" !== typeof json.value) {
		let cause = "Find-element return value is not an object.";
		dispatchSessionError(eventbus, jackrabbitId, cause);
		return;
	}

	for (let [shadowHash, shadowRootId] of Object.entries(json.value)) {
		if ("string" === typeof shadowRootId && shadowHash.startsWith("shadow-"))
			return shadowRootId;
	}
}

async function getRequestParams(
	req: IncomingMessage,
): Promise<GetElementShadowRootParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { element_id } = json;
	if ("string" === typeof element_id) {
		return { element_id };
	}
}
