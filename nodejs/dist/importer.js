export class Importer {
    #cwd;
    constructor(cwd) {
        this.#cwd = cwd;
    }
    async load(uri) {
        let uri_updated = uri;
        let absolute = uri.startsWith("/");
        if (!absolute) {
            uri_updated = this.#cwd + "/" + uri;
        }
        const { testModules } = await import(uri_updated);
        // verify here
        return testModules;
    }
}
