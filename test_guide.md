# Jackrabbit Tests

For a quick visual reference, please refer to the [examples](./examples/).

`Jackrabbit` leverages esmodules for a flat, concise testing experience. There are no assertion libraries, there are no wild BDD functions.

Developers with javascript experience can immediately start testing with basically zero overhead.

## Tests

Tests are functions or promises that return assertions.

Tests `pass` when they return the `undefined` primitive or an empty array `[]`.

```TS
// my_library.tests.ts

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
// my_library.tests.ts

function testStuffAndFail() {
	return "this test failed!";
}

function testMoreStuffAndFail() {
	return ["this test also failed!"];
}
```

## Test Modules

Test Modules are javascript `modules` that export a value named tests.

### Export Tests

Test Modules export their tests in an array called `tests`.

```TS
// my_library.tests.ts

export const tests = [
	testStuffAndPass,
	testMoreStuffAndPass,
	testStuffAndFail,
	testMoreStuffAndFail,
];
```

### Export Options

But exporting an `options` pojo with the following properties will affect the behavior of the test module:

```TS
// my.tests.ts

interface Options {
  title?: string;
  runAsynchronously?: boolean;
  timeoutMs?: number;
}
```

```TS
export const options = {
	title: import.meta.url,
	runAsyncronously: true,
	timeoutMs: 3000,
}
```

All properteis are optional and exporting an `options` pojo is not required.

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

This gathers all tests into a single explicit location.

## Run Test Collections

Run the following command and Jackrabbit will log the results of a test collection.

```sh
npx jackrabbit ./mod.tests.ts
```

To run multiple test collections, add more filepaths as commandline arguments:

```sh
npx jackrabbit ./mod.tests.ts ./another_mod.tests.ts
```

## License

BSD 3-Clause License
