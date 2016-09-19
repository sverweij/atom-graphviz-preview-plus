path = require 'path'

{Emitter, Disposable, CompositeDisposable, File} = require 'atom'
{$, $$$, ScrollView} = require 'atom-space-pen-views'
_                    = require 'underscore-plus'
fs                   = require 'fs-plus'

# Defer loading these modules until use
uuid                 = null
renderer             = null
errRenderer          = null
svgToRaster          = null

latestKnownEditorId  = null
svgWrapperElementId  = null

module.exports =
class GraphVizPreviewView extends ScrollView
  @content: ->
    @div class: 'graphviz-preview-plus native-key-bindings', tabindex: -1

  constructor: ({@editorId, @filePath}) ->
    super
    @emitter = new Emitter
    @disposables = new CompositeDisposable
    @loaded = false
    @svg = null

  attached: ->
    return if @isAttached
    @isAttached = true

    if @editorId?
      @resolveEditor(@editorId)
    else
      if atom.workspace?
        @subscribeToFilePath(@filePath)
      else
        @disposables.add atom.packages.onDidActivateInitialPackages =>
          @subscribeToFilePath(@filePath)

  serialize: ->
    deserializer: 'GraphVizPreviewView'
    filePath: @getPath() ? @filePath
    editorId: @editorId

  destroy: ->
    @disposables.dispose()

  onDidChangeTitle: (callback) ->
    @emitter.on 'did-change-title', callback

  onDidChangeModified: (callback) ->
    # No op to suppress deprecation warning
    new Disposable

  onDidChangeDot: (callback) ->
    @emitter.on 'did-change-graphviz', callback

  subscribeToFilePath: (filePath) ->
    @file = new File(filePath)
    @emitter.emit 'did-change-title'
    @handleEvents()
    @renderDot()

  resolveEditor: (editorId) ->
    resolve = =>
      @editor = @editorForId(editorId)

      if @editor?
        @emitter.emit 'did-change-title' if @editor?
        @handleEvents()
        @renderDot()
      else
        # The editor this preview was created for has been closed so close
        # this preview since a preview cannot be rendered without an editor
        atom.workspace?.paneForItem(this)?.destroyItem(this)

    if atom.workspace?
      resolve()
    else
      @disposables.add atom.packages.onDidActivateInitialPackages(resolve)

  editorForId: (editorId) ->
    for editor in atom.workspace.getTextEditors()
      return editor if editor.id?.toString() is editorId.toString()
    null

  handleEvents: ->
    @disposables.add atom.grammars.onDidAddGrammar => _.debounce((=> @renderDot()), 250)
    @disposables.add atom.grammars.onDidUpdateGrammar _.debounce((=> @renderDot()), 250)

    atom.commands.add @element,
      'core:move-up': =>
        @scrollUp()
      'core:move-down': =>
        @scrollDown()
      'core:save-as': (event) =>
        event.stopPropagation()
        @saveAs('svg')
      'graphviz-preview-plus:save-as-png': (event) =>
        event.stopPropagation()
        @saveAs('png')
      'graphviz-preview-plus:engine-dot': (event) =>
        event.stopPropagation()
        @setEngine('dot')
        @renderDot()
      'graphviz-preview-plus:engine-circo': (event) =>
        event.stopPropagation()
        @setEngine('circo')
        @renderDot()
      'graphviz-preview-plus:engine-fdp': (event) =>
        event.stopPropagation()
        @setEngine('fdp')
        @renderDot()
      'graphviz-preview-plus:engine-neato': (event) =>
        event.stopPropagation()
        @setEngine('neato')
        @renderDot()
      'graphviz-preview-plus:engine-osage': (event) =>
        event.stopPropagation()
        @setEngine('osage')
        @renderDot()
      'graphviz-preview-plus:engine-twopi': (event) =>
        event.stopPropagation()
        @setEngine('twopi')
        @renderDot()
      'core:copy': (event) =>
        event.stopPropagation() if @copyToClipboard()
      'graphviz-preview-plus:zoom-in': =>
        zoomLevel = parseFloat(@css('zoom')) or 1
        @css('zoom', zoomLevel + .1)
      'graphviz-preview-plus:zoom-out': =>
        zoomLevel = parseFloat(@css('zoom')) or 1
        @css('zoom', zoomLevel - .1)
      'graphviz-preview-plus:reset-zoom': =>
        @css('zoom', 1)

    changeHandler = =>
      @renderDot()

      # TODO: Remove paneForURI call when ::paneForItem is released
      pane = atom.workspace.paneForItem?(this) ? atom.workspace.paneForURI(@getURI())
      if pane? and pane isnt atom.workspace.getActivePane()
        pane.activateItem(this)

    if @file?
      @disposables.add @file.onDidChange(changeHandler)
    else if @editor?
      @disposables.add @editor.getBuffer().onDidStopChanging ->
        changeHandler() if atom.config.get 'graphviz-preview-plus.liveUpdate'
      @disposables.add @editor.onDidChangePath => @emitter.emit 'did-change-title'
      @disposables.add @editor.getBuffer().onDidSave ->
        changeHandler() unless atom.config.get 'graphviz-preview-plus.liveUpdate'
      @disposables.add @editor.getBuffer().onDidReload ->
        changeHandler() unless atom.config.get 'graphviz-preview-plus.liveUpdate'

  renderDot: ->
    @showLoading() unless @loaded
    @getSource().then (source) => @renderDotText(source) if source?

  getSource: ->
    if @file?.getPath()
      @file.read()
    else if @editor?
      Promise.resolve(@editor.getText())
    else
      Promise.resolve(null)

  renderDotText: (text) ->
    uuid ?= require 'node-uuid'
    # should be unique within atom to prevent duplicate id's within the
    # editor (which renders the stuff into the first element only)
    #
    # should be unique altogether because upon export they might be placed on the
    # same page together, and twice the same id is bound to have undesired
    # effects
    #
    # It's good enough to do this once for each editor instance
    if !svgWrapperElementId? or latestKnownEditorId != @editorId
      svgWrapperElementId = uuid.v4()
      latestKnownEditorId = @editorId

    @svg = null
    renderer ?= require "./renderer"
    renderer.render text, (error, svg) =>
      if error
        @showError(error)
      else
        @loading = false
        @loaded = true
        @svg = svg
        @html("<div id=#{svgWrapperElementId}>#{svg}</div>")
        @emitter.emit 'did-change-graphviz'
        @originalTrigger('graphviz-preview-plus:dot-changed')

  getSVG: (callback)->
    @getSource().then (source) ->
      return unless source?

      renderer.render source, callback

  getTitle: ->
    if @file?
      "#{path.basename(@getPath())} preview+"
    else if @editor?
      "#{@editor.getTitle()} preview+"
    else
      "GraphViz Preview+"

  getIconName: ->
    "GraphViz"

  getURI: ->
    if @file?
      "graphviz-preview-plus://#{@getPath()}"
    else
      "graphviz-preview-plus://editor/#{@editorId}"

  getPath: ->
    if @file?
      @file.getPath()
    else if @editor?
      @editor.getPath()

  getGrammar: ->
    @editor?.getGrammar()

  getDocumentStyleSheets: -> # This function exists so we can stub it
    document.styleSheets

  showError: (error) ->
    errRenderer ?= require './err-renderer'

    @getSource().then (source) =>
      @html(errRenderer.renderError source, error.message) if source?

  showLoading: ->
    @loading = true
    @html $$$ ->
      @div class: 'dot-spinner', 'Rendering graph\u2026'

  copyToClipboard: ->
    return false if @loading or not @svg

    atom.clipboard.write(@svg)

    true

  saveAs: (pOutputType) ->
    return if @loading or not @svg

    filePath = @getPath()
    if filePath
      filePath = path.join(
        path.dirname(filePath),
        path.basename(filePath, path.extname(filePath)),
      ).concat('.').concat(pOutputType)
    else
      filePath = 'untitled.'.concat(pOutputType)
      if projectPath = atom.project.getPaths()[0]
        filePath = path.join(projectPath, filePath)

    if outputFilePath = atom.showSaveDialogSync(filePath)
      if 'png' == pOutputType
        svgToRaster ?= require './svg-to-raster'
        svgToRaster.transform @svg, (pResult) ->
          fs.writeFileSync(outputFilePath, pResult)
          atom.workspace.open(outputFilePath)
      else
        fs.writeFileSync(outputFilePath, @svg)
        atom.workspace.open(outputFilePath)

  setEngine: (pEngine) ->
    return if @loading or not @svg

    atom.config.set('graphviz-preview-plus.layoutEngine', pEngine)

  isEqual: (other) ->
    @[0] is other?[0] # Compare DOM elements
