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

module.exports = {
    config: {
        liveUpdate: {
            type: 'boolean',
            "default": true,
            order: 1,
            description: 'Re-render the preview as the contents of the source changes, without requiring the ' +
                         'source buffer to be saved. If disabled, the preview is re-rendered only when the ' +
                         'buffer is saved to disk.'
        },
        openPreviewInSplitPane: {
            type: 'boolean',
            "default": true,
            order: 2,
            description: 'Open the preview in a split pane. If disabled, the preview is opened in a new tab in ' +
                         'the same pane.'
        },
        useGraphvizCommandLine: {
            type: 'boolean',
            "default": false,
            order: 3,
            description: 'Keep unchecked when in doubt.<br><br>' +
                        '- Checked: graphviz-preview-plus will use the command line version of GraphViz dot. For ' +
                        'this to work GraphViz has to be installed on your machine, and it has to be on your path.' +
                         '<br>- Unchecked: graphviz-preview-plus will use viz.js for rendering.'
        },
        GraphvizPath: {
            type: 'string',
            "default": '',
            order: 4,
            description: 'If you use the command line version of GraphViz, and GraphViz is not on your _path_, ' +
                         ' you can use this to specify where to find the executable (including the name of the ' +
                         'executable e.g. `/Users/christiaanhuygens/bin/dot`).' +
                         '<br><br>Leave empty when it\'s on your path.'
        },
        layoutEngine: {
            type: 'string',
            "default": 'dot',
            order: 5,
            description: ' GraphViz Layout engine to use.',
            "enum": ['dot', 'circo', 'fdp', 'neato', 'osage', 'twopi']
        }
    },
    deserialize: function(pState) {
        return createGraphVizPreviewView(pState);
    },
    activate: function() {
        atom.deserializers.add({
            name: 'GraphVizPreviewView',
            deserialize: function(state) {
                if (state.editorId || fs.isFileSync(state.filePath)) {
                    return createGraphVizPreviewView(state);
                }
            }
        });
        atom.commands.add('atom-workspace', {
            'graphviz-preview-plus:toggle': (function(_this) {
                return function() {
                    return _this.toggle();
                };
            })(this)
        });
        atom.workspace.addOpener(function(uriToOpen) {
            try {
                const lURL = url.parse(uriToOpen);
                let protocol = lURL.protocol;
                let host = lURL.host;
                let pathname = lURL.pathname;

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
    isActionable: function() {
        if (isGraphVizPreviewView(atom.workspace.getActivePaneItem())) {
            atom.workspace.destroyActivePaneItem();
            return null;
        }
        let editor = atom.workspace.getActiveTextEditor();
        if (editor === null) {
            return null;
        }
        let grammars = ['source.dot', 'source.gv'];
        if (grammars.indexOf(editor.getGrammar().scopeName) < 0) {
            return null;
        }
        return editor;
    },
    toggle: function() {
        let editor = null;
        if (!(editor = this.isActionable())) {
            return null;
        }
        if (!this.removePreviewForEditor(editor)) {
            return this.addPreviewForEditor(editor);
        }
    },
    uriForEditor: function(editor) {
        return `graphviz-preview-plus://editor/${editor.id}`;
    },
    removePreviewForEditor: function(editor) {
        const uri = this.uriForEditor(editor);
        let previewPane = atom.workspace.paneForURI(uri);

        if (Boolean(previewPane)) {
            previewPane.destroyItem(previewPane.itemForURI(uri));
            return true;
        } else {
            return false;
        }
    },
    addPreviewForEditor: function(editor) {
        const uri = this.uriForEditor(editor);
        let previousActivePane = atom.workspace.getActivePane();
        const options = {
            searchAllPanes: true
        };

        if (atom.config.get('graphviz-preview-plus.openPreviewInSplitPane')) {
            options.split = 'right';
        }
        atom.workspace.open(uri, options).then(function(graphVizPreviewPlusView) {
            if (isGraphVizPreviewView(graphVizPreviewPlusView)) {
                previousActivePane.activate();
            }
        });
    }
};
/* global atom */
/* eslint no-invalid-this: 0 */
/* eslint consistent-return: 0 */
