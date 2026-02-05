let jackrabbitConfig = document.querySelector("script[type=jackrabbit]")!;
let json = JSON.parse(jackrabbitConfig.textContent);
fetch(new URL("/log/", json.jackrabbit_url));
