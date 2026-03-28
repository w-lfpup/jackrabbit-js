import type { WebdriverParams } from "../config.js";

import { jsonHeaders } from "./flyweight.js";

export async function navigateTo(
	params: WebdriverParams,
	signal: AbortSignal,
	sessionId: string,
	hostAndPort: URL,
	targetPath: string,
): Promise<void> {
	let { url } = params;

	let pingUrl = new URL(targetPath, hostAndPort);
	let response = await fetch(new URL(`/session/${sessionId}/url`, url), {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify({ url: pingUrl }),
		signal,
	});

	if (200 !== response.status) {
		let cause = await response.json();
		throw new Error("navigate-to request failed", { cause });
	}
}
