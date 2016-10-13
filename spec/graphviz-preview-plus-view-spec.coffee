path             = require 'path'
fs               = require 'fs-plus'
temp             = require 'temp'
GraphVizPreviewView = require '../lib/graphviz-preview-plus-view'
grammarHelper    = require './grammarHelper'

describe "graphviz preview plus package view", ->
  [preview, workspaceElement] = []

  beforeEach ->
    @grammarDisposable = grammarHelper.makeSureGrammarExists()
    filePath = atom.project.getDirectories()[0].resolve('subdir/asample.gv')
    preview = new GraphVizPreviewView({filePath})
    jasmine.attachToDOM(preview.element)

    waitsForPromise ->
      atom.packages.activatePackage("graphviz-preview-plus")

  afterEach ->
    preview.destroy()
    if @grammarDisposable
      @grammarDisposable.dispose()

  describe "::constructor", ->
    it "shows a loading spinner and renders the dot", ->
      preview.showLoading()
      expect(preview.find('.dot-spinner')).toExist()

      waitsForPromise ->
        preview.renderDot()

  describe "serialization", ->
    newPreview = null

    afterEach ->
      newPreview?.destroy()

    # TDOO deserialization not implemented
    xit "recreates the preview when serialized/deserialized", ->
      newPreview = atom.deserializers.deserialize(preview.serialize())
      jasmine.attachToDOM(newPreview.element)
      expect(newPreview.getPath()).toBe preview.getPath()

    it "does not recreate a preview when the file no longer exists", ->
      filePath = path.join(temp.mkdirSync('graphviz-preview-plus-'), 'foo.gv')
      fs.writeFileSync(filePath, '# Hi')

      preview.destroy()
      preview = new GraphVizPreviewView({filePath})
      serialized = preview.serialize()
      fs.removeSync(filePath)

      newPreview = atom.deserializers.deserialize(serialized)
      expect(newPreview).toBeUndefined()

    it "serializes the editor id when opened for an editor", ->
      preview.destroy()

      waitsForPromise ->
        atom.workspace.open('new.gv')

      runs ->
        preview = new GraphVizPreviewView({editorId: atom.workspace.getActiveTextEditor().id})

        jasmine.attachToDOM(preview.element)
        expect(preview.getPath()).toBe atom.workspace.getActiveTextEditor().getPath()

        newPreview = atom.deserializers.deserialize(preview.serialize())
        jasmine.attachToDOM(newPreview.element)
        expect(newPreview.getPath()).toBe preview.getPath()

  describe "when core:copy is triggered", ->
    beforeEach ->
      fixturesPath = path.join(__dirname, 'fixtures')
      tempPath = temp.mkdirSync('atom')
      fs.copySync(fixturesPath, tempPath)
      atom.project.setPaths([tempPath])

      jasmine.useRealClock()

      workspaceElement = atom.views.getView(atom.workspace)
      jasmine.attachToDOM(workspaceElement)
      atom.clipboard.write "initial clipboard content"

    it "writes the rendered SVG to the clipboard", ->
      previewPaneItem = null

      waitsForPromise ->
        atom.workspace.open('subdir/序列圖.gv')
      runs ->
        atom.commands.dispatch workspaceElement, 'graphviz-preview-plus:toggle'
      waitsFor ->
        previewPaneItem = atom.workspace.getPanes()[1].getActiveItem()
      runs ->
        atom.commands.dispatch previewPaneItem.element, 'core:copy'
      waitsFor ->
        atom.clipboard.read() isnt "initial clipboard content"

      runs ->
        expect(atom.clipboard.read()).toContain """<svg """

  describe "zoom functions", ->
    previewPaneItem = null

    beforeEach ->
      fixturesPath = path.join(__dirname, 'fixtures')
      tempPath = temp.mkdirSync('atom')
      fs.copySync(fixturesPath, tempPath)
      atom.project.setPaths([tempPath])

      jasmine.useRealClock()

      workspaceElement = atom.views.getView(atom.workspace)
      jasmine.attachToDOM(workspaceElement)

      waitsForPromise ->
        atom.workspace.open('subdir/序列圖.gv')
      runs ->
        atom.commands.dispatch workspaceElement, 'graphviz-preview-plus:toggle'
      waitsFor ->
        previewPaneItem = atom.workspace.getPanes()[1].getActiveItem()

    it "3x graphviz-preview-plus:zoom-in increases the image size by 30%", ->
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-in'
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-in'
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-in'
      lSvg = previewPaneItem.imageContainer.find('svg')[0]
      expect(lSvg.style.zoom).toBe '1.3'

    it "2x graphviz-preview-plus:zoom-out decreases the image size by 20%", ->
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-out'
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-out'
      lSvg = previewPaneItem.imageContainer.find('svg')[0]
      expect(lSvg.style.zoom).toBe '0.8'

    it "graphviz-preview-plus:reset-zoom resets zoom after size change", ->
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-out'
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:reset-zoom'
      lSvg = previewPaneItem.imageContainer.find('svg')[0]
      expect(lSvg.style.zoom).toBe '1'

    it "graphviz-preview-plus:reset-zoom resets zoom after zoom-to-fit", ->
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-to-fit'
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:reset-zoom'
      lSvg = previewPaneItem.imageContainer.find('svg')[0]
      expect(lSvg.style.zoom).toBe '1'
      expect(lSvg.getAttribute('width')).toBe '200pt'

    it "graphviz-preview-plus:zoom-to-fit zooms to fit", ->
      atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:zoom-to-fit'
      lSvg = previewPaneItem.imageContainer.find('svg')[0]
      expect(lSvg.style.zoom).toBe '1'
      expect(lSvg.getAttribute('width')).toBe '100%'

  describe "when core:save-as is triggered", ->
    beforeEach ->
      fixturesPath = path.join(__dirname, 'fixtures')
      tempPath = temp.mkdirSync('atom')
      fs.copySync(fixturesPath, tempPath)
      atom.project.setPaths([tempPath])

      jasmine.useRealClock()

      workspaceElement = atom.views.getView(atom.workspace)
      jasmine.attachToDOM(workspaceElement)

    it "saves an SVG and opens it", ->
      outputPath = temp.path() + 'subdir/序列圖.svg'
      previewPaneItem = null

      waitsForPromise ->
        atom.workspace.open('subdir/序列圖.gv')
      runs ->
        atom.commands.dispatch workspaceElement, 'graphviz-preview-plus:toggle'
      waitsFor ->
        previewPaneItem = atom.workspace.getPanes()[1].getActiveItem()
      runs ->
        spyOn(atom, 'showSaveDialogSync').andReturn(outputPath)
        atom.commands.dispatch previewPaneItem.element, 'core:save-as'
      waitsFor ->
        fs.existsSync(outputPath)

      runs ->
        expect(fs.isFileSync(outputPath)).toBe true
        writtenFile = fs.readFileSync outputPath
        expect(writtenFile).toContain """<svg """

    it "saves a PNG and opens it", ->
      outputPath = temp.path() + 'subdir/序列圖.png'
      previewPaneItem = null

      waitsForPromise ->
        atom.workspace.open('subdir/序列圖.gv')
      runs ->
        atom.commands.dispatch workspaceElement, 'graphviz-preview-plus:toggle'
      waitsFor ->
        previewPaneItem = atom.workspace.getPanes()[1].getActiveItem()
      runs ->
        spyOn(atom, 'showSaveDialogSync').andReturn(outputPath)
        atom.commands.dispatch previewPaneItem.element, 'graphviz-preview-plus:save-as-png'
      waitsFor ->
        fs.existsSync(outputPath)

      runs ->
        expect(fs.isFileSync(outputPath)).toBe true
        writtenFile = fs.readFileSync outputPath
        expect(writtenFile).toContain "PNG"
