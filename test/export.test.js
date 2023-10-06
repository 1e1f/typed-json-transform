import { assert } from "chai";

describe("package access", () => {

    it("can be dynamically imported", async () => {
        const imported = await import("typed-json-transform");
        assert(imported.Graph.name === "Graph");
    });

});
