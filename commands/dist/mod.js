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
    console.log(res.status, await res.text());
}
