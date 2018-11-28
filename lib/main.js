"use babel";

import url from 'url';
import fs from 'fs-plus';

let GraphVizPreviewView = null;

function createGraphVizPreviewView(state) {
    if (GraphVizPreviewView === null) {
        GraphVizPreviewView = require('./graphviz-preview-plus-view');
    }
    return new GraphVizPreviewView(state);
}

function isGraphVizPreviewView(object) {
    if (GraphVizPreviewView === null) {
        GraphVizPreviewView = require('./graphviz-preview-plus-view');
    }
    return object instanceof GraphVizPreviewView;
}

export default {
    deserialize(pState) {
        return createGraphVizPreviewView(pState);
    },
    activate() {
        atom.deserializers.add({
            name: 'GraphVizPreviewView',
            deserialize(state) {
                if (state.editorId || fs.isFileSync(state.filePath)) {
                    return createGraphVizPreviewView(state);
                }
            }
        });
        atom.commands.add('atom-workspace', {
            'graphviz-preview-plus:toggle': () => this.toggle()
        });
        atom.workspace.addOpener(uriToOpen => {
            try {
                /* eslint node/no-deprecated-api:0 */
                const lUrl = url.parse(uriToOpen);
                const {protocol, host} = lUrl;
                let {pathname} = lUrl;

                if (protocol !== 'graphviz-preview-plus:') {
                    return null;
                }
                try {
                    if (pathname) {
                        pathname = decodeURI(pathname);
                    }
                } catch (error) {
                    return null;
                }
                if (host === 'editor') {
                    return createGraphVizPreviewView({
                        editorId: pathname.substring(1)
                    });
                } else {
                    return createGraphVizPreviewView({
                        filePath: pathname
                    });
                }
            } catch (error) {
                return null;
            }

        });
        return require('atom-package-deps').install('graphviz-preview-plus');
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
        const grammars = ['source.dot', 'source.gv'];
        if (!grammars.includes(editor.getGrammar().scopeName)) {
            return null;
        }
        return editor;
    },
    toggle() {
        let editor = null;
        if (!(editor = this.isActionable())) {
            return null;
        }
        if (!this.removePreviewForEditor(editor)) {
            return this.addPreviewForEditor(editor);
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
        const options = {
            searchAllPanes: true
        };

        if (atom.config.get('graphviz-preview-plus.openPreviewInSplitPane')) {
            options.split = atom.config.get('graphviz-preview-plus.directionToSplitPreviewPaneIn') || 'right';
        }
        atom.workspace.open(uri, options).then(graphVizPreviewPlusView => {
            if (isGraphVizPreviewView(graphVizPreviewPlusView)) {
                previousActivePane.activate();
            }
        });
    }
};
/* global atom */
/* eslint no-invalid-this: 0 */
/* eslint consistent-return: 0 */
