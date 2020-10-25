"use babel";

/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable node/global-require */
import url from "url";
import fsPlus from "fs-plus";

let GraphVizPreviewView = null;

function createGraphVizPreviewView(pState) {
  if (GraphVizPreviewView === null) {
    GraphVizPreviewView = require("./graphviz-preview-plus-view");
  }
  return new GraphVizPreviewView(pState);
}

function isGraphVizPreviewView(pObject) {
  if (GraphVizPreviewView === null) {
    GraphVizPreviewView = require("./graphviz-preview-plus-view");
  }
  return pObject instanceof GraphVizPreviewView;
}

export default {
  deserialize(pState) {
    return createGraphVizPreviewView(pState);
  },
  activate() {
    atom.deserializers.add({
      name: "gGraphVizPreviewView",
      deserialize(state) {
        if (state.editorId || fsPlus.isFileSync(state.filePath)) {
          return createGraphVizPreviewView(state);
        }
      },
    });
    atom.commands.add("atom-workspace", {
      "graphviz-preview-plus:toggle": () => this.toggle(),
    });
    atom.workspace.addOpener((pUriToOpen) => {
      try {
        /* eslint node/no-deprecated-api:0 */
        const lUrl = url.parse(pUriToOpen);
        const { protocol, host } = lUrl;
        let { pathname } = lUrl;

        if (protocol !== "graphviz-preview-plus:") {
          return null;
        }
        try {
          if (pathname) {
            pathname = decodeURI(pathname);
          }
        } catch (pError) {
          return null;
        }
        if (host === "editor") {
          return createGraphVizPreviewView({
            editorId: pathname.slice(1),
          });
        } else {
          return createGraphVizPreviewView({
            filePath: pathname,
          });
        }
      } catch (pError) {
        return null;
      }
    });
    return require("atom-package-deps").install("graphviz-preview-plus");
  },
  isActionable() {
    if (isGraphVizPreviewView(atom.workspace.getActivePaneItem())) {
      atom.workspace.destroyActivePaneItem();
      return null;
    }
    const editor = atom.workspace.getActiveTextEditor();
    if (editor === null) {
      return null;
    }
    const lGrammars = ["source.dot", "source.gv"];
    if (!lGrammars.includes(editor.getGrammar().scopeName)) {
      return null;
    }
    return editor;
  },
  toggle() {
    let lEditor = null;
    if (!(lEditor = this.isActionable())) {
      return null;
    }
    if (!this.removePreviewForEditor(lEditor)) {
      return this.addPreviewForEditor(lEditor);
    }
  },
  uriForEditor(editor) {
    return `graphviz-preview-plus://editor/${editor.id}`;
  },
  removePreviewForEditor(editor) {
    const uri = this.uriForEditor(editor);
    const previewPane = atom.workspace.paneForURI(uri);

    if (Boolean(previewPane)) {
      previewPane.destroyItem(previewPane.itemForURI(uri));
      return true;
    } else {
      return false;
    }
  },
  addPreviewForEditor(editor) {
    const uri = this.uriForEditor(editor);
    const previousActivePane = atom.workspace.getActivePane();
    const lOptions = {
      searchAllPanes: true,
    };

    if (atom.config.get("graphviz-preview-plus.openPreviewInSplitPane")) {
      lOptions.split =
        atom.config.get(
          "graphviz-preview-plus.directionToSplitPreviewPaneIn"
        ) || "right";
    }
    atom.workspace.open(uri, lOptions).then((pGraphVizPreviewPlusView) => {
      if (isGraphVizPreviewView(pGraphVizPreviewPlusView)) {
        previousActivePane.activate();
      }
    });
  },
};
/* global atom */
/* eslint no-invalid-this: 0 */
/* eslint consistent-return: 0 */
