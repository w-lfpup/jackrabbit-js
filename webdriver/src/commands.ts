import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { ChildProcess } from "child_process";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type { EventBusInterface } from "./eventbus.js";

import * as fs from "fs";
import * as path from "path";

let headers = new Headers([["Content-Type", "application/json"]]);

export async function newSession(
	params: WebdriverParams,
	signal: AbortSignal,
): Promise<string> {
	let { url, capabilities } = params;

	let res = await fetch(new URL("/session", url), {
		method: "POST",
		headers,
		body: JSON.stringify({ capabilities: capabilities ?? {} }),
		signal,
	});
	if (200 !== res.status) {
		let cause = await res.text();
		throw new Error("Failed to create a session", { cause });
	}

	let json = await res.json();
	let { sessionId } = json?.value;
	if (typeof sessionId !== "string") throw new Error("session is not a string");

	return sessionId;
}

export async function deleteSession(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	eventbus: EventBusInterface,
	sessionId: string | undefined,
): Promise<void> {
	let { url, jackrabbitId } = params;
	try {
		let delReqest = await fetch(new URL(`/session/${sessionId}`, url), {
			method: "DELETE",
			headers,
			body: null,
			signal: signal,
		});
		if (200 !== delReqest.status) {
			let cause = await delReqest.json();
			throw new Error("delete-cookie request failed", { cause });
		}
	} catch (e) {
		eventbus.dispatchAction({
			type: "log",
			jackrabbitId,
			loggerAction: {
				type: "session_error",
				error: e?.toString() ?? "failed to delete browser session error",
			},
		});
	}
}

export async function go(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
	hostAndPort: URL,
	targetPath: string,
): Promise<void> {
	let { url } = params;

	let pingUrl = new URL(targetPath, hostAndPort);
	let getCookie = await fetch(new URL(`/session/${sessionId}/url`, url), {
		method: "POST",
		headers,
		body: JSON.stringify({ url: pingUrl }),
		signal,
	});

	if (200 !== getCookie.status) {
		let cause = await getCookie.json();
		throw new Error("go-to-cookie request failed", { cause });
	}
}

export async function addCookie(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
): Promise<void> {
	let { url, jackrabbitId } = params;

	let cookieReq = await fetch(new URL(`/session/${sessionId}/cookie`, url), {
		method: "POST",
		headers,
		body: JSON.stringify({
			cookie: {
				name: "jackrabbit",
				value: jackrabbitId,
				path: "/",
				httpOnly: true,
			},
		}),
		signal,
	});

	if (200 !== cookieReq.status) {
		let cause = await cookieReq.json();
		throw new Error("set-cookie request failed", { cause });
	}
}

interface FindElementParams {
	using: "css selector";
	value: string;
}

export async function findElement(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string | undefined,
	params: WebdriverParams,
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
			headers,
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

export async function elementClick(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url } = params;

	let elementId = await getElementClickBody(req);
	if (!elementId) throw new Error("Failed to deserialize ElementClick body.");

	let resposne = await fetch(
		new URL(`/session/${sessionId}/element/${elementId}/click`, url),
		{
			method: "POST",
			headers,
			body: JSON.stringify({}),
			signal,
		},
	);

	if (200 !== resposne.status) {
		let cause = await resposne.json();
		throw new Error("element-click request failed", { cause });
	}

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

async function getElementClickBody(
	req: IncomingMessage,
): Promise<string | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, element_id } = json;
	if ("element_click" === type && "string" === typeof element_id) {
		return element_id;
	}
}

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
			headers,
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

export async function takeElementScreenshot(
	req: IncomingMessage,
	res: ServerResponse,
	signal: AbortSignal | undefined,
	params: WebdriverParams,
	sessionId: string,
): Promise<void> {
	let { url, title } = params;

	let reqParams = await getTakeElementScreenshotBody(req);
	if (!reqParams)
		throw new Error("Failed to deserialize TakeElementScreenshot body.");

	let { element_id, target_filepath } = reqParams;

	let resposne = await fetch(
		new URL(`/session/${sessionId}/element/${element_id}/screenshot`, url),
		{
			method: "GET",
			headers,
			signal,
		},
	);

	if (200 !== resposne.status) {
		let cause = await resposne.json();
		throw new Error("take-element-screenshot request failed", { cause });
	}

	let json = await resposne.json();
	let base64 = json.value;
	if ("string" !== typeof base64)
		throw new Error("element screenshot is not a base64 string");

	// get path relative to cwd
	// if /absolute path
	//
	// join process.cwd() + target_filepath;
	let buffer = Buffer.from(base64, "base64");
	await saveFileToDisk(target_filepath, title, buffer);

	res.writeHead(200, { "content-type": "text/plain" });
	res.end();
}

interface TakeElementScreenshotParams {
	element_id: string;
	target_filepath: string;
}

async function getTakeElementScreenshotBody(
	req: IncomingMessage,
): Promise<TakeElementScreenshotParams | undefined> {
	let json = await getJsonFromRequestBody(req);
	let { type, element_id, target_filepath } = json;
	if (
		"take_element_screenshot" === type &&
		"string" === typeof element_id &&
		"string" === typeof target_filepath
	) {
		return { element_id, target_filepath };
	}
}

function getJsonFromRequestBody(req: IncomingMessage): Promise<any> {
	return new Promise(function (resolve, reject) {
		let data: Uint8Array[] = [];
		req.addListener("data", function (chunk) {
			data.push(chunk);
		});
		req.addListener("end", function () {
			let actionStr = Buffer.concat(data).toString();
			let action = JSON.parse(actionStr);

			resolve(action);
		});
		req.addListener("error", function (err: Error) {
			reject(err);
		});
	});
}

async function saveFileToDisk(
	target_filepath: string,
	title: string,
	buffer: Buffer,
): Promise<void> {
	// make sure path is in current working directory?
	let cwd = process.cwd();
	let filepath = path.join(cwd, target_filepath);
	if (!filepath.startsWith(cwd))
		throw new Error("Screenshot filepath is out of scope (not in cwd)");

	let ext = path.extname(filepath);
	if (ext) filepath = filepath.substring(0, filepath.length - ext.length);

	let title_ext = title.toLowerCase().replaceAll(" ", "_");
	filepath = `${filepath}.${title_ext}.png`;

	// create directories
	let dir = path.dirname(filepath);
	await fs.promises.mkdir(dir, { recursive: true });
	// write file
	await fs.promises.writeFile(filepath, buffer);
}

export async function findElements() {}
export async function findElementFromElement() {}
export async function findElementsFromElements() {}
export async function findShadowRoot() {}
export async function findElementFromShadowRoot() {}
export async function findElementsFromShadowRoot() {}