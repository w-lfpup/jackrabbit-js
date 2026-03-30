// LOG not technically a webdriver command but needed for degbug
export * from "./add_cookie.js";
export * from "./element_click.js";
export * from "./element_send_keys.js";
export * from "./find_element_from_element.js";
export * from "./find_element_from_shadow_root.js";
export * from "./find_element.js";
export * from "./find_elements_from_element.js";
export * from "./find_elements_from_shadow_root.js";
export * from "./find_elements.js";
export * from "./get_element_shadow_root.js";
export * from "./log.js";
export * from "./navigate_to.js";
export * from "./sessions.js";
export * from "./take_element_screenshot.js";

// should errors be sent to session errors
// but returned as a 400?

// let routeMap = new Map([
// 	["/cmd/element_click", elementClick],
// 	["/cmd/element_send_keys", elementSendKeys],
// 	["/cmd/find_element_from_element", findElementFromElement],
// 	["/cmd/find_element_from_shadow_root", findElementFromShadowRoot],
// 	["/cmd/find_element", findElement],
// 	["/cmd/find_elements_from_element", findElementsFromElement],
// 	["/cmd/find_elements_from_shadow_root", findElementsFromShadowRoot],
// 	["/cmd/find_elements", findElements],
// 	["/cmd/get_element_shadow_root", getElementShadowRoot],
// 	["/cmd/log", log],
// 	["/cmd/take_element_screenshot", takeElementScreenshot],
// ]);

// export async function webdriverCommands(
// 	req: IncomingMessage,
// 	res: ServerResponse,
// 	sessionId: string | undefined,
// 	params: WebdriverParams,
// ) {
// 	if (!sessionId) return;

// 	// expecting http 1.1
// 	let reqUrl = req.url;
// 	if (reqUrl) {
// 		let action = routeMap.get(reqUrl);
// 		if (action) return action(req, res, undefined, params, sessionId);
// 	}

// 	res.writeHead(400);
// 	res.end();
// }
