"use babel";
/* eslint-disable node/global-require */

let renderGraphVizWithCli = null;
let viz = null;

// eslint-disable-next-line complexity
function render(pScript = "", pWorkingDirectory, pCallback) {
  let lResult = null;
  const lOptions = {
    format: "svg",
    engine: atom.config.get("graphviz-preview-plus.layoutEngine") || "dot",
  };

  if (atom.config.get("graphviz-preview-plus.useGraphvizCommandLine")) {
    if (renderGraphVizWithCli === null) {
      renderGraphVizWithCli = require("./render-graphviz-with-cli");
    }
    if (Boolean(atom.config.get("graphviz-preview-plus.GraphvizPath"))) {
      lOptions.exec = atom.config.get("graphviz-preview-plus.GraphvizPath");
    }
    if (Boolean(pWorkingDirectory)) {
      lOptions.workingDirectory = pWorkingDirectory;
    }
    renderGraphVizWithCli(pScript, pCallback, lOptions);
  } else {
    if (viz === null) {
      viz = require("viz.js");
    }
    try {
      lResult = viz(pScript, lOptions);
      pCallback(null, lResult);
    } catch (pError) {
      pCallback({
        message: pError.toString(),
      });
    }
  }
}

export default render;
/* global atom */
