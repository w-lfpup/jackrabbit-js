export async function findElement(css_selector) {
    let action = {
        type: "find_element",
        css_selector,
    };
    let res = await fetch(`/cmd/find_element`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 === res.status)
        return await res.text();
}
export async function elementClick(element_id) {
    let action = {
        type: "element_click",
        element_id,
    };
    let res = await fetch(`/cmd/element_click`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    return 200 === res.status;
}
export async function elementSendKeys(element_id, text) {
    let action = {
        type: "element_send_keys",
        element_id,
        text,
    };
    let res = await fetch(`/cmd/element_send_keys`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    return 200 === res.status;
}
export async function takeElementScreenshot(element_id, target_filepath) {
    let action = {
        type: "take_element_screenshot",
        element_id,
        target_filepath,
    };
    let res = await fetch(`/cmd/take_element_screenshot`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    return 200 === res.status;
}
export async function log() { }
export async function findElements() { }
export async function findElementFromElement() { }
export async function findElementsFromElements() { }
export async function findShadowRoot() { }
export async function findElementFromShadowRoot() { }
export async function findElementsFromShadowRoot() { }
