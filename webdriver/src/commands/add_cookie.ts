import type { WebdriverParams } from "../config.js";

import { headers } from "./flyweight.js";

export async function addCookie(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
): Promise<void> {
	let { url, jackrabbitId } = params;

	let response = await fetch(new URL(`/session/${sessionId}/cookie`, url), {
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

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("Add-cookie request failed.", { cause });
	}
}
