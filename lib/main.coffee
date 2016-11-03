url      = require 'url'
fs       = require 'fs-plus'

GraphVizPreviewView = null # Defer until used

createGraphVizPreviewView = (state) ->
  GraphVizPreviewView ?= require './graphviz-preview-plus-view'
  new GraphVizPreviewView(state)

isGraphVizPreviewView = (object) ->
  GraphVizPreviewView ?= require './graphviz-preview-plus-view'
  object instanceof GraphVizPreviewView

module.exports =
  config:
    liveUpdate:
      type: 'boolean'
      default: true
      order: 1
      description: 'Re-render the preview as the contents of the source changes, without requiring the source buffer to be saved. If disabled, the preview is re-rendered only when the buffer is saved to disk.'
    openPreviewInSplitPane:
      type: 'boolean'
      default: true
      order: 2
      description: 'Open the preview in a split pane. If disabled, the preview is opened in a new tab in the same pane.'
    useGraphvizCommandLine:
      type: 'boolean'
      default: false
      order: 3
      description: '**Experimental** Keep unchecked when in doubt.<br><br>- Checked: graphviz-preview-plus will use the command line version of GraphViz dot. For this to work GraphViz has to be installed on your machine, and it has to be on your path.<br>- Unchecked: graphviz-preview-plus will use viz.js for rendering.'
    GraphvizPath:
      type: 'string'
      default: ''
      order: 4
      description: '**Experimental** If you use the command line version of GraphViz, and GraphViz is not on your _path_, you can use this to specify where to find the executable (including the name of the executable e.g. `/Users/christiaanhuygens/bin/dot`).<br><br>Leave empty when it\'s on your path.'
    layoutEngine:
      type: 'string'
      default: 'dot'
      order: 5
      description: ' GraphViz Layout engine to use.'
      enum: ['dot', 'circo', 'fdp', 'neato', 'osage', 'twopi']

  activate: ->
    atom.deserializers.add
      name: 'GraphVizPreviewView'
      deserialize: (state) ->
        if state.editorId or fs.isFileSync(state.filePath)
          createGraphVizPreviewView(state)
    atom.commands.add 'atom-workspace',
      'graphviz-preview-plus:toggle': =>
        @toggle()

    # previewFile = @previewFile.bind(this)
    # atom.commands.add '.tree-view .file .name[data-name$=\\.dot]', 'graphviz-preview-plus:preview-file', previewFile

    atom.workspace.addOpener (uriToOpen) ->
      try
        {protocol, host, pathname} = url.parse(uriToOpen)
      catch
        return

      return unless protocol is 'graphviz-preview-plus:'

      try
        pathname = decodeURI(pathname) if pathname
      catch
        return

      if host is 'editor'
        createGraphVizPreviewView(editorId: pathname.substring(1))
      else
        createGraphVizPreviewView(filePath: pathname)

    # Installs language-dot
    # This returns a promise. Deliberately not handled.
    require('atom-package-deps').install('graphviz-preview-plus')

  isActionable: ->
    if isGraphVizPreviewView(atom.workspace.getActivePaneItem())
      atom.workspace.destroyActivePaneItem()
      return

    editor = atom.workspace.getActiveTextEditor()
    return unless editor?

    grammars = [
      'source.dot',
      'source.gv'
    ]
    return unless editor.getGrammar().scopeName in grammars

    return editor

  toggle: ->
    return unless editor = @isActionable()
    @addPreviewForEditor(editor) unless @removePreviewForEditor(editor)

  uriForEditor: (editor) ->
    "graphviz-preview-plus://editor/#{editor.id}"

  removePreviewForEditor: (editor) ->
    uri = @uriForEditor(editor)
    previewPane = atom.workspace.paneForURI(uri)
    if previewPane?
      previewPane.destroyItem(previewPane.itemForURI(uri))
      true
    else
      false

  addPreviewForEditor: (editor) ->
    uri = @uriForEditor(editor)
    previousActivePane = atom.workspace.getActivePane()
    options =
      searchAllPanes: true
    if atom.config.get('graphviz-preview-plus.openPreviewInSplitPane')
      options.split = 'right'
    atom.workspace.open(uri, options).then (graphVizPreviewPlusView) ->
      if isGraphVizPreviewView(graphVizPreviewPlusView)
        previousActivePane.activate()

  # previewFile: ({target}) ->
  #   filePath = target.dataset.path
  #   return unless filePath
  #
  #   for editor in atom.workspace.getTextEditors() when editor.getPath() is filePath
  #     @addPreviewForEditor(editor)
  #     return
  #
  #   atom.workspace.open "graphviz-preview-plus://#{encodeURI(filePath)}", searchAllPanes: true
