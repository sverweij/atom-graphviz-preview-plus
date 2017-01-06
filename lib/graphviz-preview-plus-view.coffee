path = require 'path'

{Emitter, Disposable, CompositeDisposable, File} = require 'atom'
{$, $$$, ScrollView} = require 'atom-space-pen-views'
_                    = require 'underscore-plus'
fs                   = require 'fs-plus'

# Defer loading these modules until use
renderer             = null
errRenderer          = null
svgToRaster          = null

latestKnownEditorId  = null

module.exports =
class GraphVizPreviewView extends ScrollView

  @content: ->
    @div class: 'graphviz-preview-plus native-key-bindings', tabindex: -1, =>
      @div class: 'image-controls', outlet: 'imageControls', =>
        @div class: 'image-controls-group', =>
          @a outlet: 'whiteTransparentBackgroundButton', class: 'image-controls-color-white', value: 'white', =>
            @text 'white'
          @a outlet: 'blackTransparentBackgroundButton', class: 'image-controls-color-black', value: 'black', =>
            @text 'black'
          @a outlet: 'transparentTransparentBackgroundButton', class: 'image-controls-color-transparent', value: 'transparent', =>
            @text 'transparent'
        @div class: 'image-controls-group btn-group', =>
          @button class: 'btn', outlet: 'zoomOutButton', '-'
          @button class: 'btn reset-zoom-button', outlet: 'resetZoomButton', '100%'
          @button class: 'btn', outlet: 'zoomInButton', '+'
        @div class: 'image-controls-group btn-group', =>
          @button class: 'btn', outlet: 'zoomToFitButton', 'Zoom to fit'

      @div class: 'image-container', background: 'white', outlet: 'imageContainer'

  constructor: ({@editorId, @filePath}) ->
    super
    @emitter        = new Emitter
    @disposables    = new CompositeDisposable
    @loaded         = false
    @svg            = null
    @zoomFactor     = 1
    @renderedSVG    = null
    @originalWidth  = 481
    @originalHeight = 481
    @mode           = 'zoom-manual'

    @disposables.add atom.tooltips.add @whiteTransparentBackgroundButton[0], title: "Use white transparent background"
    @disposables.add atom.tooltips.add @blackTransparentBackgroundButton[0], title: "Use black transparent background"
    @disposables.add atom.tooltips.add @transparentTransparentBackgroundButton[0], title: "Use transparent background"

    @zoomInButton.on 'click', => @zoomIn()
    @zoomOutButton.on 'click', => @zoomOut()
    @resetZoomButton.on 'click', => @resetZoom()
    @zoomToFitButton.on 'click', => @zoomToFit()

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

    if @getPane()
      @imageControls.find('a').on 'click', (e) =>
        @changeBackground $(e.target).attr 'value'

  serialize: ->
    deserializer: 'GraphVizPreviewView'
    filePath: @getPath() ? @filePath
    editorId: @editorId

  destroy: ->
    @disposables.dispose()

  onDidChangeTitle: (callback) ->
    @emitter.on 'did-change-title', callback

  onDidChangeModified: () ->
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
      'graphviz-preview-plus:zoom-in': => @zoomIn()
      'graphviz-preview-plus:zoom-out': => @zoomOut()
      'graphviz-preview-plus:reset-zoom': => @resetZoom()
      'graphviz-preview-plus:zoom-to-fit': => @zoomToFit()

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
    if latestKnownEditorId != @editorId
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
        @imageContainer.html(svg)
        @renderedSVG = @imageContainer.find('svg')
        @originalWidth = @renderedSVG.attr('width')
        @originalHeight = @renderedSVG.attr('height')

        if @mode is 'zoom-to-fit'
          @renderedSVG.attr('width', '100%')
          @renderedSVG.attr('height', @renderedSVG[0].clientHeight * @determineZoomToFitFactor())
        else
          @setZoom @zoomFactor

        @emitter.emit 'did-change-graphviz'
        @originalTrigger('graphviz-preview-plus:dot-changed')

  getSVG: (callback)->
    @getSource().then (source) ->
      return unless source?

      renderer.render source, callback

  getTitle: ->
    if @file?
      "#{path.basename(@getPath())} preview+ (#{atom.config.get('graphviz-preview-plus.layoutEngine')})"
    else if @editor?
      "#{@editor.getTitle()} preview+ (#{atom.config.get('graphviz-preview-plus.layoutEngine')})"
    else
      "GraphViz preview+"

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
      @imageContainer.html(errRenderer.renderError source, error.message) if source?

  showLoading: ->
    @loading = true
    @imageContainer.html $$$ ->
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
    @emitter.emit 'did-change-title'

  # image control functions
  # Retrieves this view's pane.
  #
  # Returns a {Pane}.
  getPane: ->
    @parents('.pane')[0]

  zoomOut: ->
    @adjustZoom -.1

  zoomIn: ->
    @adjustZoom .1

  adjustZoom: (delta)->
    zoomLevel = parseFloat(@renderedSVG.css('zoom')) or 1
    if (zoomLevel + delta) > 0
      @setZoom (zoomLevel + delta)

  setZoom: (factor) ->
    return unless @loaded and @isVisible()

    factor ?= 1

    if @mode is 'zoom-to-fit'
      @mode = 'zoom-manual'
      @zoomToFitButton.removeClass 'selected'
    else if @mode is 'reset-zoom'
      @mode = 'zoom-manual'

    @renderedSVG.attr('width', @originalWidth)
    @renderedSVG.attr('height', @originalHeight)
    @renderedSVG.css('zoom', factor)
    @resetZoomButton.text(Math.round((factor) * 100) + '%')
    @zoomFactor = factor

  # Zooms the image to its normal width and height.
  resetZoom: ->
    return unless @loaded and @isVisible()

    @mode = 'reset-zoom'
    @zoomToFitButton.removeClass 'selected'
    @setZoom 1
    @resetZoomButton.text('100%')

  determineZoomToFitFactor: ->
    scaleFactor = Math.min @imageContainer.context.clientWidth / @renderedSVG[0].clientWidth, @imageContainer.context.clientHeight / @renderedSVG[0].clientHeight
    Math.min scaleFactor, 1

  # Zooms to fit the image
  zoomToFit: ->
    return unless @loaded and @isVisible()

    @setZoom 1
    @mode = 'zoom-to-fit'
    @imageContainer.addClass 'zoom-to-fit'
    @zoomToFitButton.addClass 'selected'

    @renderedSVG.attr('width', '100%')
    @renderedSVG.attr('height', @renderedSVG[0].clientHeight * @determineZoomToFitFactor())
    @resetZoomButton.text('Auto')

  # Changes the background color of the image view.
  #
  # color - A {String} that gets used as class name.
  changeBackground: (color) ->
    return unless @loaded and @isVisible() and color
    @imageContainer.attr('background', color)

  isEqual: (other) ->
    @[0] is other?[0] # Compare DOM elements
