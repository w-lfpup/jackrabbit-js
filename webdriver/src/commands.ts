import type { IncomingMessage, ServerResponse } from "http";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES
import type { ChildProcess } from "child_process";
import type { ConfigInterface, WebdriverParams } from "./config.js";
import type { EventBusInterface } from "./eventbus.js";

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
	sessionId: string | undefined,
	params: WebdriverParams,
) {
	if (!sessionId) return;

	let elementId = await findElementRequest(
		req,
		params,
		undefined,
		sessionId,
	)
	if (!elementId) {
		res.writeHead(401);
		res.end();
		return
	}

	res.writeHead(200, {"content-type": "text/plain"})
	res.write(elementId);
	res.end();
}

// need event bus to send errors to error log
export async function findElementRequest(
	req: IncomingMessage,
	params: WebdriverParams, // driver defined state
	signal: AbortSignal | undefined, // driver defined state
	sessionId: string, // derived state associated with driver
): Promise<string | undefined> {
	let { url } = params;

	let bodyJson = await getFindElementBody(req);
	if (!bodyJson)
		throw new Error("Failed to deserialize FindElement body.");

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
		for (let key of Object.keys(json.value)) {
			if (
				"string" === typeof key &&
				key.startsWith("element-")
			)
			return key;
		}
	}
}

async function getFindElementBody(req: IncomingMessage): Promise<FindElementParams | undefined>  {
	let json = await getJsonFromRequestBody(req);
	let { type, css_selector } = json;
	if ("find_element" === type && "string" === typeof css_selector) {
		return { using: "css selector", value: css_selector }
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
