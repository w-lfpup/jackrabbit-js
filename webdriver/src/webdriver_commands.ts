import type { WebdriverParams } from "./config.js";
import type { EventBusInterface } from "./eventbus.js";

let headers = new Headers([["Content-Type", "application/json"]]);

export async function untilWebdriverReady(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
): Promise<void> {
	let { url } = params;

	while (signal && !signal.aborted) {
		try {
			let res = await fetch(new URL("/status", url), {
				method: "GET",
				headers,
				body: null,
				signal,
			});

			if (200 === res.status) {
				let json = await res.json();
				let { ready } = json?.value;
				if (typeof ready === "boolean" && ready) return;
			}
		} catch {}

		await sleep(30);
	}

	throw new Error("Webdriver was never ready.");
}

export async function getSession(params: WebdriverParams, signal: AbortSignal) {
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

export async function goToPing(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
	hostAndPort: URL,
) {
	let { url } = params;

	let pingUrl = new URL("/ping", hostAndPort);
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

export async function setCookie(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
) {
	let { url, jrId } = params;

	let cookieReq = await fetch(new URL(`/session/${sessionId}/cookie`, url), {
		method: "POST",
		headers,
		body: JSON.stringify({
			cookie: {
				name: "jackrabbit",
				value: jrId,
				// domain: this.#hostAndPort (issues in firefox)
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

export async function goToTestPage(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
	hostAndPort: URL,
) {
	let { url } = params;

	let goToUrlRes = await fetch(new URL(`/session/${sessionId}/url`, url), {
		method: "POST",
		headers,
		body: JSON.stringify({ url: hostAndPort }),
		signal,
	});

	if (200 !== goToUrlRes.status) throw new Error("go-to-url request failed");
}

export async function deleteSession(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	eventbus: EventBusInterface,
	sessionId: string | undefined,
) {
	let { url } = params;
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
			type: "session_error",
			id: params.jrId,
			error: e?.toString() ?? "failed to delete browser session error",
		});
	}
}

function sleep(timeMs: number): Promise<void> {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve();
		}, timeMs);
	});
}

// BELOW ARE ACTIONS FROM TESTS THEMSELVES

// need event bus to send errors to error log
export async function getElement(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	sessionId: string,
	cssSelector: string,
): Promise<string | undefined> {
	let { url } = params;

	let res = await fetch(
		new URL(new URL(`/session/${sessionId}/element`, url)),
		{
			method: "GET",
			headers,
			body: JSON.stringify({ using: "css selector", value: cssSelector }),
			signal,
		},
	);

	if (200 === res.status) {
		let json = await res.json();
		if ("object" !== typeof json?.value) return;
		// throw new Error("getElements return value is not an object");

		for (let [key, value] of json?.value.entries()) {
			if (
				"string" === typeof key &&
				"string" === typeof value &&
				key.startsWith("element-")
			)
				return value;
		}
	}
}

// export async function getElements(
// 	params: WebdriverParams,
// 	signal: AbortSignal | undefined,
// 	sessionId: string,
// 	cssSelector: string,
// ): Promise<string[]> {
// 	let { url } = params;

// 	let res = await fetch(
// 		new URL(new URL(`/session/${sessionId}/elements`, url)),
// 		{
// 			method: "GET",
// 			headers,
// 			body: JSON.stringify({ using: "css selector", value: cssSelector }),
// 			signal,
// 		},
// 	);

// 	let queryResults: string[] = [];

// 	if (200 === res.status) {
// 		let json = await res.json();
// 		if (!Array.isArray(json.value))
// 			throw new Error("getElements return value is not an array");

// 		let queryResults: string[] = [];
// 		for (let val of json.value) {
// 			if (typeof val === "object") {
// 				for (let [key, value] of val.entries()) {
// 					if (
// 						"string" === typeof key &&
// 						"string" === typeof value &&
// 						key.startsWith("element-")
// 					)
// 						queryResults.push(value);
// 				}
// 			}
// 		}
// 	}

// 	return queryResults;
// }

// export async function getScreenshot(
// 	params: WebdriverParams,
// 	signal: AbortSignal | undefined,
// 	sessionId: string,
// 	elementId: string,
// ): Promise<string | undefined> {
// 	let { url } = params;

// 	let res = await fetch(
// 		new URL(new URL(`/session/${sessionId}/screenshot`, url)),
// 		{
// 			method: "GET",
// 			headers,
// 			body: undefined,
// 			signal,
// 		},
// 	);

// 	if (200 === res.status) {
// 		let json = await res.json();
// 		if ("string" !== typeof json.value)
// 			throw new Error("getScreenshot return value is not a string");

// 		return json.value;
// 	}
// }

// export async function getScreenshotOfElementAsBase64EncodedPng(
// 	params: WebdriverParams,
// 	signal: AbortSignal | undefined,
// 	sessionId: string,
// 	elementId: string,
// ): Promise<string | undefined> {
// 	let { url } = params;

// 	let res = await fetch(
// 		new URL(new URL(`/session/${sessionId}/element/${elementId}/screenshot
// `, url)),
// 		{
// 			method: "GET",
// 			headers,
// 			body: undefined,
// 			signal,
// 		},
// 	);

// 	if (200 === res.status) {
// 		let json = await res.json();
// 		if ("string" !== typeof json.value)
// 			throw new Error("getElementScreenshot return value is not a string");

// 		return json.value;
// 	}
// }

// [200, string]
// [400, Error]

// /session/{session id}/actions POST
// keyboard
//  {
//    "actions": [
//      {
//        "type": "key",
//        "id": "keyboard",
//        "actions": [
//          {"type": "keyDown", "value": "\uE009"},
//          {"type": "keyDown", "value": "s"},
//          {"type": "keyUp", "value": "\uE009"},
//          {"type": "keyUp", "value": "s"}
//        ]
//      }
//    ]
//  }

// /session/{session id}/actions POST
// pointers
//  {
//    "actions": [
//      {
//        "type": "pointer",
//        "id": "finger1",
//        "parameters": {"pointerType": "touch"},
//        "actions": [
//          {"type": "pointerMove", "duration": 0, "x": 100, "y": 100},
//          {"type": "pointerDown", "button": 0},
//          {"type": "pause", "duration": 500},
//          {"type": "pointerMove", "duration": 1000, "origin": "pointer", "x": -50, "y": 0},
//          {"type": "pointerUp", "button": 0}
//        ]
//      }, {
//        "type": "pointer",
//        "id": "finger2",
//        "parameters": {"pointerType": "touch"},
//        "actions": [
//          {"type": "pointerMove", "duration": 0, "x": 100, "y": 100},
//          {"type": "pointerDown", "button": 0},
//          {"type": "pause", "duration": 500},
//          {"type": "pointerMove", "duration": 1000, "origin": "pointer", "x": 50, "y": 0},
//          {"type": "pointerUp", "button": 0}
//        ]
//      }
//    ]
//  }

// Release all actions
// /session/{session id}/actions DELETE
