"use babel";

import renderer from '../lib/renderer';

describe("renderer", () => {
    it("a valid program renders as an svg", () => {
        renderer.render('graph { a -- b [label="okiedokie"]}', (err, ok) => {
            expect(err).toBe(null && expect(ok).toContain('<svg '));
        });
    });

    it("an invalid program returns an error", () => {
        renderer.render('this is an invalid program', (err, ok) => {
            expect(err.message).toContain("Error: syntax error in line 1 near 'this'");
            expect(ok).toBeUndefined();
        });
    });

    it("recovers from an error viz.js doesn't recover from", () => {
        renderer.render('graph {a --b [label="unrecoverable]}', (err, ok) => {
            expect(err.message).toContain("Error: syntax error in line 1 near");
            expect(ok).toBeUndefined();
            renderer.render('graph {a --b [label="unrecoverable]}', (err1, ok1) => {
                expect(err1.message).toContain("Error: syntax error in line 1 near");
                expect(ok1).toBeUndefined();
                renderer.render('graph {a --b [label="unrecoverable]}', (err2, ok2) => {
                    expect(err2.message).toContain("Error: syntax error in line 1 near");
                    expect(ok2).toBeUndefined();
                    renderer.render('graph {a --b [label="unrecoverable"]}', (err3, ok3) => {
                        expect(ok3).toContain('<svg ');
                        expect(err3).toBe(null);
                    });
                });
            });
        });
    });
});

/* eslint max-nested-callbacks: 0 */
