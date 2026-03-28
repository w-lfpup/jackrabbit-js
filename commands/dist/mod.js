export async function findElement(css_selector) {
    let action = {
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
export async function log(message) {
    let action = {
        type: "log",
        message,
    };
    let res = await fetch(`/cmd/log`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    return 200 === res.status;
}
export async function findElements(css_selector) {
    let action = {
        css_selector,
    };
    let res = await fetch(`/cmd/find_elements`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 !== res.status)
        return;
    let json = await res.json();
    if (!Array.isArray(json))
        return;
    let elementIds = [];
    for (let item of json) {
        if ("string" === typeof item)
            elementIds.push(item);
    }
    return elementIds;
}
export async function findElementFromElement(element_id, css_selector) {
    let action = {
        css_selector,
        element_id,
    };
    let res = await fetch(`/cmd/find_element_from_element`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 === res.status)
        return await res.text();
}
export async function findElementsFromElement(element_id, css_selector) {
    let action = {
        element_id,
        css_selector,
    };
    let res = await fetch(`/cmd/find_elements_from_element`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 !== res.status)
        return;
    let json = await res.json();
    if (!Array.isArray(json))
        return;
    let elementIds = [];
    for (let item of json) {
        if ("string" === typeof item)
            elementIds.push(item);
    }
    return elementIds;
}
export async function getElementShadowRoot(element_id) {
    let action = {
        element_id,
    };
    let res = await fetch(`/cmd/get_element_shadow_root`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 === res.status)
        return await res.text();
}
export async function findElementFromShadowRoot(shadow_root_id, css_selector) {
    let action = {
        css_selector,
        shadow_root_id,
    };
    let res = await fetch(`/cmd/find_element_from_shadow_root`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 === res.status)
        return await res.text();
}
export async function findElementsFromShadowRoot(shadow_root_id, css_selector) {
    let action = {
        shadow_root_id,
        css_selector,
    };
    let res = await fetch(`/cmd/find_elements_from_shadow_root`, {
        body: JSON.stringify(action),
        headers: new Headers([["Content-Type", "application/json"]]),
        method: "POST",
    });
    if (200 !== res.status)
        return;
    let json = await res.json();
    if (!Array.isArray(json))
        return;
    let elementIds = [];
    for (let item of json) {
        if ("string" === typeof item)
            elementIds.push(item);
    }
    return elementIds;
}
