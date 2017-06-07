"use babel";

import render from '../lib/renderGraphViz';

describe("renderGraphViz", () => {
    it("renders a valid program as an svg", () => {
        render('graph { a -- b [label="okiedokie"]}', (err, ok) => {
            expect(err).toBe(null && expect(ok).toContain('<svg '));
        });
    });

    it("returns an error on an invalid program", () => {
        render('this is an invalid program', (err, ok) => {
            expect(err.message).toContain("Error: syntax error in line 1 near 'this'");
            expect(ok).toBeUndefined();
        });
    });

    it("recovers from an error viz.js doesn't recover from", () => {
        render('graph {a --b [label="unrecoverable]}', (err, ok) => {
            expect(err.message).toContain("Error: syntax error in line 1 scanning a quoted string (missing");
            expect(ok).toBeUndefined();
            render('graph {a --b [label="unrecoverable]}', (err1, ok1) => {
                expect(err1.message).toContain("Error: syntax error in line 1 scanning a quoted string (missing");
                expect(ok1).toBeUndefined();
                render('graph {a --b [label="unrecoverable]}', (err2, ok2) => {
                    expect(err2.message).toContain("Error: syntax error in line 1 scanning a quoted string (missing");
                    expect(ok2).toBeUndefined();
                    render('graph {a --b [label="unrecoverable"]}', (err3, ok3) => {
                        expect(ok3).toContain('<svg ');
                        expect(err3).toBe(null);
                    });
                });
            });
        });
    });
});

/* eslint max-nested-callbacks: 0 */
