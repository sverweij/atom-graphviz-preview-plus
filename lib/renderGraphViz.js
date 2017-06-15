"use babel";

let renderGraphVizWithCLI = null;
let viz = null;

function render(pScript = '', pCallback, pRetry = false) {
    let lResult = null;
    const lOptions = {
        format: 'svg',
        engine: atom.config.get('graphviz-preview-plus.layoutEngine') || 'dot'
    };

    if (atom.config.get('graphviz-preview-plus.useGraphvizCommandLine')) {
        if (renderGraphVizWithCLI === null) {
            renderGraphVizWithCLI = require('./renderGraphVizWithCLI');
        }
        if (Boolean(atom.config.get('graphviz-preview-plus.GraphvizPath'))) {
            lOptions.exec = atom.config.get('graphviz-preview-plus.GraphvizPath');
        }
        renderGraphVizWithCLI(pScript, pCallback, lOptions);
    } else {
        if (viz === null) {
            viz = require('viz.js');
        }
        try {
            lResult = viz(pScript, lOptions);
            pCallback(null, lResult);
        } catch (error) {
            // workaround for https://github.com/mdaines/viz.js/issues/59
            // - viz.js gets into an unrecoverable state when presented with a graphviz
            //   source containing unclosed strings(e.g. `graph {a[label="unclosed]}`)
            // - the only solution seems to be to re-load viz.js
            // - just setting it to null is not enough - node keeps viz.js
            //   _including its unrecoverable state_ in a cache - so require'ing
            //   it would re-create the problem
            // - hence the explicit cache deletion (which makes the next
            //   "require 'viz.js'" slow)
            // - after that we retry the render
            //
            // viz.js 1.8.0 (and up, I presume) doesn't have this issue anymore.
            // However, mysteriously, it is still possible an older version of
            // viz.js is used, even though package.json explicitly
            // specifies the dependency's precise version
            // (see https://github.com/sverweij/atom-graphviz-preview-plus/issues/16)
            if (
                pRetry === false &&
                error.toString() === "Error: syntax error in line 1 near '\"'\n"
            ) {
                viz = null;
                delete require.cache[require.resolve('viz.js')];
                exports.render(pScript, pCallback, true);
            } else {
                pCallback({
                    message: error.toString()
                });
            }
        }
    }
}

export default render;
/* global atom */
