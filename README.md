# Jackrabbit-js

A test-runner for nodejs and the browser

[![Tests](https://github.com/w-lfpup/jackrabbit-js/actions/workflows/tests.yml/badge.svg)](https://github.com/w-lfpup/jackrabbit-js/actions/workflows/tests.yml)

## Install

Install jackrabbit with npm.

```sh
npm install --save-dev @w-lfpup/jackrabbit
```

Or Install jackrabbit directly from github.

```sh
npm install --save-dev https://github.com/w-lfpup/jackrabbit-js
```

# Framework agnostic tests

Jackrabbit tests are decoupled from jackrabbit test runners.

Test runners rely on properties exported from `test modules` and `test collections`. These properties control test behavior like timeouts or asynchronous runs.

This means you could technically swap `jackrabbit` with your own test runner without updating your tests!

For a quick visual reference, please refer to the [examples](./examples/).

## Tests

Tests are functions or promises that return assertions.

Tests `pass` when they return the `undefined` primitive or an empty array `[]`.

```TS
// my.tests.ts

function testStuffAndPass() {
	return;
}

function testMoreStuffAndPass() {
	return [];
}
```

Any other value will cause a test to `fail`.

So tests that `fail` look like:

```TS
// my.tests.ts

function testStuffAndFail() {
	return "this test failed!";
}

function testMoreStuffAndFail() {
	return ["this test also failed!"];
}
```

## Test Modules

Test Modules are javascript `modules` that export two values: `tests` and `options`.

### Export Tests

Test Modules export their tests in an array called `tests`.

```TS
// my.tests.ts

export const tests = [
	testStuffAndPass,
	testMoreStuffAndPass,
	testStuffAndFail,
	testMoreStuffAndFail,
];
```

### Export Options

Export a parameter object named `options` to affect test behaviors in the current module:

```TS
// my.tests.ts

interface Options {
  runAsynchronously?: boolean;
  timeoutMs?: number;
  title?: string;
}

...

export const options = {
	runAsyncronously: true,
	timeoutMs: 3000,
	title: import.meta.url,
}
```

All properties are optional and exporting an `options` pojo is not required.

Tests run sequentially unless the `runAsyncronously` property is set to `true`.

## Test Collections

A `test collection` is a javascript module that exports a list test modules called `testModules`.

```TS
// mod.test.ts

import * as MyTests from "./my.tests.ts";

export const testModules = [
	MyTests
];
```

## Test runners

### NodeJS

Run the following command to log the results of a test collection in nodejs.

```sh
npx jackrabbit ./mod.tests.ts
```

To run multiple test collections, add more filepaths as commandline arguments:

```sh
npx jackrabbit ./mod.tests.ts ./another_mod.tests.ts
```

### Webdrivers

Jackrabbit runs tests in browsers via webdrivers which require a configuration file:

```JSON
{
	"jackrabbit_url": "http://localhost:4000",
	"run_asynchronously": false,
	"webdrivers": [
		{
			"title": "Firefox",
			"command": "geckodriver -p 4001",
			"timeout_ms": 20000,
			"url": "http://localhost:4001",
			"capabilities": {
				"alwaysMatch": {
					"moz:firefoxOptions": {
						"args": ["-headless"]
					}
				}
			}
		}
	]
}
```

Run the following command to log the results of a test collection from a browser.

```sh
npx jackrabbit_webdriver ./config.json ./mod.tests.ts
```

To run multiple test collections, add more filepaths as commandline arguments:

```sh
npx jackrabbit_webdriver ./config.json ./mod.tests.ts ./another_mod.tests.ts
```

[Here](./examples/webdriver_config.json) is an example of a webdriver configuration file. Jackrabbit tests itself on every major browser in github actions using [these](./.github/workflows/) configuration files.

### Webdriver commands

The following webdriver commands are available:

- Element click
- Element send keys
- Find element
- Find element from element
- Find element from shadow root
- Find elements
- Find elements from element
- Find elements from shadow root
- Get element shadow root
- Take element screenshot
- Log (not a spec-compliant webdriver command but helpful)

#### Find element

Find an element id with a css selector.

```ts
import { findElement } from "@w-lfpup/jackrabbit";

let elementId: string | undefined = await findElement("p");
```

#### Find elements

Find all element ids matching a css selector.

```ts
import { findElements } from "@w-lfpup/jackrabbit";

let elementIds: string[] = await findElements("input[checkbox]");
```

#### Find element from element

Find all descendant element ids matching a css selector.

```ts
import { findElementFromElements } from "@w-lfpup/jackrabbit";

let elementId: string | undefined = await findElementFromElements(
	"<element_id>",
	"input[checkbox]",
);
```

#### Find elements from element

Find all descendant element ids matching a css selector.

```ts
import { findElementsFromElements } from "@w-lfpup/jackrabbit";

let elementIds: string[] = await findElementsFromElements(
	"<element_id>",
	"input[checkbox]",
);
```

#### Get element shadow root

If available, get the shadow root id of an element with an id

```ts
import { getElementShadowRoot } from "@w-lfpup/jackrabbit";

let shadowRootId: string | undefined = await getElementShadowRoot(elementId);
```

#### Find element from shadow root

Find all descendant element ids matching a css selector.

```ts
import { findElementFromShadowRoot } from "@w-lfpup/jackrabbit";

let elementId: string | undefined = await findElementFromShadowRoot(
	"<element_id>",
	"input[checkbox]",
);
```

#### Find elements from shadow root

Find all descendant element ids matching a css selector.

```ts
import { findElementsFromShadowRoot } from "@w-lfpup/jackrabbit";

let elementIds: string[] = await findElementsFromShadowRoot(
	"<element_id>",
	"input[checkbox]",
);
```

#### Element click

Click an element.

```ts
import { elementClick } from "@w-lfpup/jackrabbit";

let elementWasClicked: boolean = await elementClick("<element_id>");
```

#### Element send keys

Send keys to an element.

```ts
import { elementSendKeys } from "@w-lfpup/jackrabbit";

let keysWereSent: boolean = await elementSendKeys(
	"<element_id>",
	"keys to send!",
);
```

#### Take element screenshot

Get a screenshot of an element with their element id and save it to disk.

```ts
import { takeElementScreenshot } from "@w-lfpup/jackrabbit";

await takeElementScreenshot(elementId, "./path/relative/to/cwd.png");
```

## License

`Jackrabbit-js` is released under the BSD 3-Clause License.
