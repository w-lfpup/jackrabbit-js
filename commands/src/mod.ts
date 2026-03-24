// find element just needs a string in body (element-28902489215801)
//

interface FindElement {
	type: "find_element";
	css_selector: string;
}

// /session/<session_id>/element
// find element can be just a string

interface ElementClick {
	type: "element_click";
	element_id: string;
}

// /session/{session id}/element/{element id}/click
// value can just be a string

interface ElementSendKeys {
	type: "element_click";
	element_id: string;
	value: string;
}

// /session/{session id}/element/{element id}/value
// only need to send a string

interface TakeElementScreenshot {
	type: "take_element_screenshot";
	element_id: string;
	value: string;
}

// /session/{session id}/element/{element id}/screenshot

export type commands =
	| FindElement
	| ElementClick
	| ElementSendKeys
	| TakeElementScreenshot;
