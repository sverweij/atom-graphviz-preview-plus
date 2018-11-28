"use babel";

const renderError = require('../lib/renderError');

const ERROR_SMALLER_THEN_FIXTURE = `<div class='error-wrap'>
        <div class='block error-head'>
            <span class='inline-block icon icon-flame highlight'>error</span>
            <span class='error-text'>&lt;&lt;&lt;</span>
        </div>
        <pre class='code'>
  1 &lt;&lt;</pre>
    </div>`;

describe("renderError", () => {
    it("replaces < with &lt;", () => {
        expect(
            renderError("<<", "<<<")
        ).toEqual(ERROR_SMALLER_THEN_FIXTURE);
    });
});

/* eslint import/no-namespace: 0 */
