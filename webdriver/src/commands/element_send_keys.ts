import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { WebdriverParams } from "../config.js";
import type { EventBusInterface } from "../eventbus.js";

import * as fs from "fs";
import * as path from "path";
import { jsonHeaders, getJsonFromRequestBody } from "./flyweight.js";

export async function elementSendKeys(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url } = params;

	let reqParams = await getElementSendKeysBody(req);
	if (!reqParams)
		throw new Error("Failed to deserialize ElementSendKeys body.");

	let { element_id, text } = reqParams;

	let resposne = await fetch(
		new URL(`/session/${sessionId}/element/${element_id}/value`, url),
		{
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({ text }),
			signal,
		},
	);

	if (200 !== resposne.status) {
		let cause = await resposne.json();
		throw new Error("element-send-keys request failed", { cause });
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

interface ElementSendKeysParams {
	text: string;
	element_id: string;
}

async function getElementSendKeysBody(
	req: IncomingMessage,
): Promise<ElementSendKeysParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, element_id, text } = json;
	if (
		"element_send_keys" === type &&
		"string" === typeof element_id &&
		"string" === typeof text
	) {
		return { element_id, text };
	}
}
