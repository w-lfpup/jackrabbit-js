#!/usr/bin/env node
import * as path from "path";
let cwd = path.parse(process.cwd());
let jrCorePath = path.join(import.meta.url, "../../core/");
let jrBrowserPath = path.join(import.meta.url, "../../browser/");
console.log(jrCorePath);
console.log(jrBrowserPath);
