import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { WebdriverParams } from "../config.js";
import type { EventBusInterface } from "../eventbus.js";

import * as fs from "fs";
import * as path from "path";
import { jsonHeaders, getJsonFromRequestBody } from "./flyweight.js";

interface FindElementParams {
	using: "css selector";
	value: string;
}


export async function findElement(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
) {
	if (!sessionId) return;

	let elementId = await findElementRequest(req, params, undefined, sessionId);
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
async function findElementRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { url } = params;

	let bodyJson = await getFindElementBody(req);
	if (!bodyJson) throw new Error("Failed to deserialize FindElement body.");

	let findElementRes = await fetch(
		new URL(new URL(`/session/${sessionId}/element`, url)),
		{
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify(bodyJson),
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

async function getFindElementBody(
	req: IncomingMessage,
): Promise<FindElementParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, css_selector } = json;
	if ("find_element" === type && "string" === typeof css_selector) {
		return { using: "css selector", value: css_selector };
	}
}