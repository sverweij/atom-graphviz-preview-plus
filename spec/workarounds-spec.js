"use babel";

import * as workarounds from '../lib/workarounds';

describe("workarounds", () => {
    // describe("correctViewBox", () => true);

    // describe("makeLinksClickable", () => true);

    describe("defineEntities", () => {
        it("leaves input without nbsp entities in it alone", () => {
            expect(
                workarounds.defineEntities("whatever")
            ).toEqual("whatever");
        });
        it("leaves input without nbsp entities in it alone", () => {
            expect(
                workarounds.defineEntities("bladie bla &nbsp; bla")
            ).toEqual("<!DOCTYPE svg [<!ENTITY nbsp \"&#160;\">]>bladie bla &nbsp; bla");
        });
    });

    // describe("resolveImages", () => true);
});

/* eslint import/no-namespace: 0 */
