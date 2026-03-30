import type { WebdriverParams } from "../config.js";
import type { EventBusInterface } from "../eventbus.js";

import { headers } from "./flyweight.js";

export async function newSession(
	params: WebdriverParams,
	signal: AbortSignal,
): Promise<string> {
	let { url, capabilities } = params;

	let response = await fetch(new URL("/session", url), {
		method: "POST",
		headers: headers,
		body: JSON.stringify({ capabilities: capabilities ?? {} }),
		signal,
	});
	if (200 !== response.status) {
		let cause = await response.text();
		throw new Error("Failed to create a session", { cause });
	}

	let json = await response.json();
	let { sessionId } = json?.value;
	if (typeof sessionId !== "string") throw new Error("Session is not a string");

	return sessionId;
}

export async function deleteSession(
	params: WebdriverParams,
	signal: AbortSignal | undefined,
	eventbus: EventBusInterface,
	sessionId: string,
): Promise<void> {
	let { url, jackrabbitId } = params;
	try {
		let response = await fetch(new URL(`/session/${sessionId}`, url), {
			method: "DELETE",
			headers,
			body: null,
			signal: signal,
		});
		if (200 !== response.status) {
			let cause = await response.json();
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
