"use babel";

import render from "../lib/render-graphviz.js";

describe("renderGraphViz", () => {
  it("renders a valid program as an svg", () => {
    render('graph { a -- b [label="okiedokie"]}', "", (pError, pOk) => {
      expect(pError).toBe(null && expect(pOk).toContain("<svg "));
    });
  });

  it("returns an error on an invalid program", () => {
    render("this is an invalid program", "", (pError, pOk) => {
      expect(pError.message).toContain(
        "Error: syntax error in line 1 near 'this'"
      );
      expect(pOk).toBeUndefined();
    });
  });

  it("recovers from an error viz.js doesn't recover from", () => {
    render('graph {a --b [label="unrecoverable]}', "", (pError, pOk) => {
      expect(pError.message).toContain(
        "Error: syntax error in line 1 scanning a quoted string (missing"
      );
      expect(pOk).toBeUndefined();
      render('graph {a --b [label="unrecoverable]}', "", (pError1, pOk1) => {
        expect(pError1.message).toContain(
          "Error: syntax error in line 1 scanning a quoted string (missing"
        );
        expect(pOk1).toBeUndefined();
        render('graph {a --b [label="unrecoverable]}', "", (pError2, pOk2) => {
          expect(pError2.message).toContain(
            "Error: syntax error in line 1 scanning a quoted string (missing"
          );
          expect(pOk2).toBeUndefined();
          render('graph {a --b [label="unrecoverable"]}', "", (pError3, pOk3) => {
            expect(pOk3).toContain("<svg ");
            expect(pError3).toBe(null);
          });
        });
      });
    });
  });
});

/* eslint max-nested-callbacks: 0 */
