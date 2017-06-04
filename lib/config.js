"use babel";

export default {
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
    directionToSplitPreviewPaneIn: {
        type: 'string',
        "default": 'right',
        order: 3,
        description: "The direction to split the preview pane to. Usually you want that to be 'right' " +
                     "(the default), unless you edit with a vertical display when 'bottom' is probably better.",
        "enum": ['right', 'down']
    },
    useGraphvizCommandLine: {
        type: 'boolean',
        "default": false,
        order: 4,
        description: 'Keep unchecked when in doubt.<br><br>' +
                    '- Checked: graphviz-preview-plus will use the command line version of GraphViz dot. For ' +
                    'this to work GraphViz has to be installed on your machine, and it has to be on your path.' +
                     '<br>- Unchecked: graphviz-preview-plus will use viz.js for rendering.'
    },
    GraphvizPath: {
        type: 'string',
        "default": '',
        order: 5,
        description: 'If you use the command line version of GraphViz, and GraphViz is not on your _path_, ' +
                     ' you can use this to specify where to find the executable (including the name of the ' +
                     'executable e.g. `/Users/christiaanhuygens/bin/dot`).' +
                     '<br><br>Leave empty when it\'s on your path.'
    },
    layoutEngine: {
        type: 'string',
        "default": 'dot',
        order: 6,
        description: ' GraphViz Layout engine to use.',
        "enum": ['dot', 'circo', 'fdp', 'neato', 'osage', 'twopi']
    }
};
