import type { WebdriverParams } from "./config.js";

// BELOW ARE ACTIONS FROM TESTS THEMSELVES

export async function webdriverCommands(params: WebdriverParams) {
	let { url } = params;
	let urlStr = url.toString();
	if (urlStr === "/cmd/find_element") {
	}
	if (urlStr === "/cmd/element_click") {
	}
	if (urlStr === "/cmd/element_send_keys") {
	}
	if (urlStr === "/cmd/send_keys") {
	}
	if (urlStr === "/cmd/take_element_screenshot") {
	}
}
