"use babel";

let renderGraphVizWithCLI = null;
let viz = null;

function render(pScript = '', pWorkingDirectory, pCallback) {
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
        if (Boolean(pWorkingDirectory)) {
            lOptions.workingDirectory = pWorkingDirectory;
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
            pCallback({
                message: error.toString()
            });
        }
    }
}

export default render;
/* global atom */
