import { createRequire } from "node:module";
import { assert } from "chai";
// import { check } from "../esm";
// import { CustomType } from "../esm/fixtures";


describe("package access", () => {

    it("can be dynamically imported", async () => {
        const imported = await import("typed-json-transform");
        assert(imported.Graph.name === "Graph");
    });
});
