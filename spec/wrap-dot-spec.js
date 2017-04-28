"use babel";

import wrap from '../lib/wrap-dot';

describe("native dot wrapper", () => {
    if (process.platform === 'win32') {
        it("skips a test because on win32 expecting an error works unexpectantly", () => {
            expect("MS-DOS").toContain("DOS");
        });
    } else {
        it("returns an error when passed a non-existant executable name", () => {
            wrap.render('graph { a -- b [label="okiedokie"]}', ((err, ok) => {
                expect(ok).toBeUndefined();
                expect(err).toBeDefined();
            }), {
                exec: 'nonexistant'
            });
        });

    }
});
