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
    if (200 === res.status)
        return await res.text();
}
