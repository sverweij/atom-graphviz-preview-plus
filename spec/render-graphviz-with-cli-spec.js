"use babel";

import renderGraphVizWithCLI from "../lib/render-graphviz-with-cli.js";

describe("native dot wrapper", () => {
  if (process.platform === "win32") {
    it("skips a test because on win32 expecting an error works unexpectantly", () => {
      expect("MS-DOS").toContain("DOS");
    });
  } else {
    xit("returns an error when passed a non-existant executable name", () => {
      renderGraphVizWithCLI(
        'graph { a -- b [label="okiedokie"]}',
        (pError, pOk) => {
          expect(pOk).toBeUndefined();
          expect(pError).toBeDefined();
        },
        {
          exec: "nonexistant",
        }
      );
    });
  }
});
