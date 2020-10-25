"use babel";
/* eslint-disable node/global-require */
/* eslint-disable max-lines */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-magic-numbers */
/* global atom */

import { CompositeDisposable, Disposable, Emitter, File } from "atom";
import path from "path";
import fs from "fs";
import { $, $$$, ScrollView } from "atom-space-pen-views";
import _ from "underscore-plus";

let gRenderGraphViz = null;
let gRenderError = null;
let svgToRaster = null;
let workarounds = null;

let gLatestKnownEditorId = null;
const ZOOM_STEP = 0.1;

export default class GraphVizPreviewView extends ScrollView {
  static content() {
    this.div(
      {
        class: "graphviz-preview-plus native-key-bindings",
        tabindex: -1,
      },
      () => {
        this.div(
          {
            class: "image-controls",
            outlet: "imageControls",
          },
          () => {
            this.div(
              {
                class: "image-controls-group",
              },
              () => {
                this.a(
                  {
                    outlet: "whiteTransparentBackgroundButton",
                    class: "image-controls-color-white",
                    value: "white",
                  },
                  () => this.text("white")
                );
                this.a(
                  {
                    outlet: "blackTransparentBackgroundButton",
                    class: "image-controls-color-black",
                    value: "black",
                  },
                  () => this.text("black")
                );
                this.a(
                  {
                    outlet: "transparentTransparentBackgroundButton",
                    class: "image-controls-color-transparent",
                    value: "transparent",
                  },
                  () => this.text("transparent")
                );
              }
            );
            this.div(
              {
                class: "image-controls-group btn-group",
              },
              () => {
                this.button(
                  {
                    class: "btn",
                    outlet: "zoomOutButton",
                  },
                  "-"
                );
                this.button(
                  {
                    class: "btn reset-zoom-button",
                    outlet: "resetZoomButton",
                  },
                  "100%"
                );
                this.button(
                  {
                    class: "btn",
                    outlet: "zoomInButton",
                  },
                  "+"
                );
              }
            );
            this.div(
              {
                class: "image-controls-group btn-group",
              },
              () => {
                this.button(
                  {
                    class: "btn",
                    outlet: "zoomToFitButton",
                  },
                  "Zoom to fit"
                );
              }
            );
          }
        );
        this.div({
          class: "image-container",
          background: "white",
          outlet: "imageContainer",
        });
      }
    );
  }

  constructor({ editorId, filePath }) {
    super();

    this.editorId = editorId;
    this.filePath = filePath;

    this.emitter = new Emitter();
    this.disposables = new CompositeDisposable();
    this.loaded = false;
    this.svg = null;
    this.zoomFactor = 1;
    this.renderedSVG = null;
    this.originalWidth = 481;
    this.originalHeight = 481;
    this.mode = "zoom-manual";
    this.disposables.add(
      atom.tooltips.add(this.whiteTransparentBackgroundButton[0], {
        title: "Use white transparent background",
      })
    );
    this.disposables.add(
      atom.tooltips.add(this.blackTransparentBackgroundButton[0], {
        title: "Use black transparent background",
      })
    );
    this.disposables.add(
      atom.tooltips.add(this.transparentTransparentBackgroundButton[0], {
        title: "Use transparent background",
      })
    );

    this.zoomInButton.on("click", () => this.zoomIn());
    this.zoomOutButton.on("click", () => this.zoomOut());
    this.resetZoomButton.on("click", () => this.resetZoom());
    this.zoomToFitButton.on("click", () => this.zoomToFit());
  }

  attached() {
    if (this.isAttached) {
      return;
    }
    this.isAttached = true;
    if (Boolean(this.editorId)) {
      this.resolveEditor(this.editorId);
    } else if (Boolean(atom.workspace)) {
      this.subscribeToFilePath(this.filePath);
    } else {
      this.disposables.add(
        atom.packages.onDidActivateInitialPackages(() =>
          this.subscribeToFilePath(this.filePath)
        )
      );
    }
    if (this.getPane()) {
      this.imageControls
        .find("a")
        .on("click", (pE) => this.changeBackground($(pE.target).attr("value")));
    }
  }

  serialize() {
    return {
      deserializer: "deserializeGraphVizPreviewView",
      filePath: Boolean(this.getPath()) ? this.getPath() : this.filePath,
      editorId: this.editorId,
    };
  }

  destroy() {
    return this.disposables.dispose();
  }

  onDidChangeTitle(callback) {
    return this.emitter.on("did-change-title", callback);
  }

  onDidChangeModified() {
    return new Disposable();
  }

  onDidChangeDot(callback) {
    return this.emitter.on("did-change-graphviz", callback);
  }

  subscribeToFilePath(filePath) {
    this.file = new File(filePath);
    this.emitter.emit("did-change-title");
    this.handleEvents();
    return this.renderDot();
  }

  resolveEditor(editorId) {
    const resolve = () => {
      this.editor = this.editorForId(editorId);
      if (Boolean(this.editor)) {
        this.emitter.emit("did-change-title");
        this.handleEvents();
        this.renderDot();
      } else if (
        Boolean(atom.workspace) &&
        Boolean(atom.workspace.paneForItem(this))
      ) {
        atom.workspace.paneForItem(this).destroyItem(this);
      }
    };
    if (Boolean(atom.workspace)) {
      return resolve();
    } else {
      return this.disposables.add(
        atom.packages.onDidActivateInitialPackages(resolve)
      );
    }
  }

  editorForId(pEditorId) {
    return atom.workspace
      .getTextEditors()
      .find(
        (pEditor) =>
          pEditor.hasOwnProperty("id") &&
          pEditor.id !== null &&
          pEditor.id.toString() === pEditorId.toString()
      );
  }

  handleEvents() {
    this.disposables.add(
      atom.grammars.onDidAddGrammar(() =>
        _.debounce(() => this.renderDot(), 250)
      )
    );
    this.disposables.add(
      atom.grammars.onDidUpdateGrammar(_.debounce(() => this.renderDot(), 250))
    );
    atom.commands.add(this.element, {
      "core:move-up": () => this.scrollUp(),
      "core:move-down": () => this.scrollDown(),
      "core:save-as": (pEvent) => {
        pEvent.stopPropagation();
        this.saveAs("svg");
      },
      "graphviz-preview-plus:save-as-png": (pEvent) => {
        pEvent.stopPropagation();
        this.saveAs("png");
      },
      "graphviz-preview-plus:engine-dot": (pEvent) => {
        pEvent.stopPropagation();
        this.setEngine("dot");
        this.renderDot();
      },
      "graphviz-preview-plus:engine-circo": (pEvent) => {
        pEvent.stopPropagation();
        this.setEngine("circo");
        this.renderDot();
      },
      "graphviz-preview-plus:engine-fdp": (pEvent) => {
        pEvent.stopPropagation();
        this.setEngine("fdp");
        this.renderDot();
      },
      "graphviz-preview-plus:engine-neato": (pEvent) => {
        pEvent.stopPropagation();
        this.setEngine("neato");
        this.renderDot();
      },
      "graphviz-preview-plus:engine-osage": (pEvent) => {
        pEvent.stopPropagation();
        this.setEngine("osage");
        this.renderDot();
      },
      "graphviz-preview-plus:engine-twopi": (pEvent) => {
        pEvent.stopPropagation();
        this.setEngine("twopi");
        this.renderDot();
      },
      "core:copy": (pEvent) => {
        if (this.copyToClipboard()) {
          pEvent.stopPropagation();
        }
      },
      "graphviz-preview-plus:zoom-in": () => this.zoomIn(),
      "graphviz-preview-plus:zoom-out": () => this.zoomOut(),
      "graphviz-preview-plus:reset-zoom": () => this.resetZoom(),
      "graphviz-preview-plus:zoom-to-fit": () => this.zoomToFit(),
      "graphviz-preview-plus:zoom-to-width": () => this.zoomToWidth(),
      "graphviz-preview-plus:zoom-to-height": () => this.zoomToHeight(),
    });
    const changeHandler = () => {
      this.renderDot();

      const pane = Boolean(atom.workspace.paneForItem(this))
        ? atom.workspace.paneForItem(this)
        : atom.workspace.paneForURI(this.getURI());
      if (Boolean(pane) && pane !== atom.workspace.getActivePane()) {
        pane.activateItem(this);
      }
    };
    if (Boolean(this.file)) {
      this.disposables.add(this.file.onDidChange(changeHandler));
    } else if (Boolean(this.editor)) {
      this.disposables.add(
        this.editor.getBuffer().onDidStopChanging(() => {
          if (atom.config.get("graphviz-preview-plus.liveUpdate")) {
            changeHandler();
          }
        })
      );
      this.disposables.add(
        this.editor.onDidChangePath(() => this.emitter.emit("did-change-title"))
      );
      this.disposables.add(
        this.editor.getBuffer().onDidSave(() => {
          if (!atom.config.get("graphviz-preview-plus.liveUpdate")) {
            changeHandler();
          }
        })
      );
      this.disposables.add(
        this.editor.getBuffer().onDidReload(() => {
          if (!atom.config.get("graphviz-preview-plus.liveUpdate")) {
            changeHandler();
          }
        })
      );
    }
  }

  determineWorkingDirectory() {
    let lReturnValue = null;

    if (Boolean(this.editor) && Boolean(this.editor.getPath())) {
      lReturnValue = path.dirname(this.editor.getPath().toString());
    } else if (Boolean(atom.project) && Boolean(atom.project.getPaths())) {
      /*
       * when there is no editorPath, it might be a buffer.
       * A path from the project is a logical choice then => choosing
       * the first path here as a best guess.
       */
      lReturnValue = atom.project.getPaths()[0];
    }
    return lReturnValue;
  }

  renderDot() {
    const lWorkingDirectory = this.determineWorkingDirectory();

    if (!this.loaded) {
      this.showLoading();
    }
    return this.getSource().then((pSource) => {
      if (pSource !== null) {
        return this.renderDotText(pSource, lWorkingDirectory);
      }
      return null;
    });
  }

  getSource() {
    if (Boolean(this.file)) {
      return this.file.read();
    } else if (Boolean(this.editor)) {
      return Promise.resolve(this.editor.getText());
    } else {
      return Promise.resolve(null);
    }
  }

  renderDotText(pText, pWorkingDirectory) {
    if (gLatestKnownEditorId !== this.editorId) {
      gLatestKnownEditorId = this.editorId;
    }
    this.svg = null;
    if (gRenderGraphViz === null) {
      gRenderGraphViz = require("./render-graphviz");
    }
    return gRenderGraphViz(pText, pWorkingDirectory, (pError, pSvg) => {
      if (pError) {
        return this.showError(pError);
      } else {
        this.loading = false;
        this.loaded = true;
        if (workarounds === null) {
          workarounds = require("./workarounds");
        }

        this.imageContainer.html(pSvg);
        this.renderedSVG = this.imageContainer.find("svg");
        workarounds.correctViewBox(this.renderedSVG);
        this.svg = workarounds.defineEntities(this.renderedSVG[0].outerHTML);

        // this workaround only for the svg in the preview window
        // ... not in the exported one
        workarounds.makeLinksClickable(this.renderedSVG);

        this.originalWidth = this.renderedSVG.attr("width");
        this.originalHeight = this.renderedSVG.attr("height");
        if (Boolean(pWorkingDirectory)) {
          workarounds.resolveImages(this.renderedSVG, pWorkingDirectory);
        }

        if (this.mode === "zoom-to-fit") {
          this.renderedSVG.attr("width", "100%");
          this.renderedSVG.attr(
            "height",
            this.renderedSVG[0].clientHeight * this.determineZoomToFitFactor()
          );
        } else {
          this.setZoom(this.zoomFactor);
        }

        this.emitter.emit("did-change-graphviz");
        return this.originalTrigger("graphviz-preview-plus:dot-changed");
      }
    });
  }

  getSVG(callback) {
    return this.getSource().then((pSource) => {
      if (pSource === null) {
        return null;
      }
      return gRenderGraphViz(pSource, callback);
    });
  }

  getTitle() {
    if (Boolean(this.file)) {
      return `${path.basename(this.getPath())} preview+ (${atom.config.get(
        "graphviz-preview-plus.layoutEngine"
      )})`;
    } else if (Boolean(this.editor)) {
      return `${this.editor.getTitle()} preview+ (${atom.config.get(
        "graphviz-preview-plus.layoutEngine"
      )})`;
    } else {
      return "GraphViz preview+";
    }
  }

  getIconName() {
    return "GraphViz";
  }

  getURI() {
    if (Boolean(this.file)) {
      return `graphviz-preview-plus://${this.getPath()}`;
    } else {
      return `graphviz-preview-plus://editor/${this.editorId}`;
    }
  }

  getPath() {
    let lReturnValue = "";

    if (Boolean(this.file)) {
      lReturnValue = this.file.getPath();
    } else if (Boolean(this.editor)) {
      lReturnValue = this.editor.getPath();
    }
    return lReturnValue;
  }

  getGrammar() {
    return this.editor.getGrammar();
  }

  getDocumentStyleSheets() {
    return document.styleSheets;
  }

  showError(error) {
    if (gRenderError === null) {
      gRenderError = require("./render-error");
    }
    return this.getSource().then((pSource) => {
      if (Boolean(pSource)) {
        return this.imageContainer.html(gRenderError(pSource, error.message));
      }
      return null;
    });
  }

  showLoading() {
    this.loading = true;
    this.imageContainer.html(
      $$$(function drawSpinner() {
        this.div(
          {
            class: "dot-spinner",
          },
          "Rendering graph\u2026"
        );
      })
    );
  }

  copyToClipboard() {
    if (this.loading || !this.svg) {
      return false;
    }
    atom.clipboard.write(this.svg);
    return true;
  }

  getFilePath(pOutputType) {
    let filePath = this.getPath();
    if (filePath) {
      filePath = path
        .join(
          path.dirname(filePath.toString()),
          path.basename(filePath, path.extname(filePath))
        )
        .concat(".")
        .concat(pOutputType);
    } else {
      filePath = "untitled.".concat(pOutputType);
      const projectPath = atom.project.getPaths()[0];
      if (Boolean(projectPath)) {
        filePath = path.join(projectPath, filePath);
      }
    }
    return filePath;
  }

  async saveAs(pOutputType) {
    if (this.loading || !this.svg) {
      return;
    }

    const lDialogOutput = await atom.applicationDelegate.showSaveDialog(
      this.getFilePath(pOutputType)
    );
    const lOutputFilePath = lDialogOutput.filePath;
    if (Boolean(lOutputFilePath)) {
      if ("png" === pOutputType) {
        if (svgToRaster === null) {
          svgToRaster = require("./svg-to-raster");
        }
        svgToRaster(this.svg, (pResult, pError) => {
          if (Boolean(pError)) {
            atom.notifications.addError("Too big to export", {
              detail: `Atom cannot export this graph to PNG because it is too big
for that. If you want a PNG out of this graph your best
option at the moment is to use the GraphViz command line:
    dot -T png -o yourgraph.png yourgraph.dot`,
              dismissable: true,
            });
          } else {
            fs.writeFileSync(lOutputFilePath, pResult);
            atom.workspace.open(lOutputFilePath);
          }
        });
      } else {
        fs.writeFileSync(lOutputFilePath, this.svg);
        atom.workspace.open(lOutputFilePath);
      }
    }
  }

  setEngine(pEngine) {
    atom.config.set("graphviz-preview-plus.layoutEngine", pEngine);
    if (this.loading || !this.svg) {
      return;
    }
    this.emitter.emit("did-change-title");
  }

  getPane() {
    return this.parents(".pane")[0];
  }

  zoomOut() {
    this.adjustZoom(0 - ZOOM_STEP);
  }

  zoomIn() {
    this.adjustZoom(ZOOM_STEP);
  }

  adjustZoom(delta) {
    let lZoomLevel = 1;
    if (
      Boolean(this.renderedSVG) &&
      typeof this.renderedSVG.css === "function"
    ) {
      lZoomLevel = Number.parseFloat(this.renderedSVG.css("zoom"));
    }

    if (lZoomLevel + delta > 0) {
      this.setZoom(lZoomLevel + delta);
    }
  }

  setZoom(factor) {
    if (!(this.loaded && this.isVisible())) {
      return;
    }
    if (factor === null) {
      factor = 1;
    }
    if (this.mode === "zoom-to-fit") {
      this.mode = "zoom-manual";
      this.zoomToFitButton.removeClass("selected");
    } else if (this.mode === "reset-zoom") {
      this.mode = "zoom-manual";
    }
    if (Boolean(this.renderedSVG)) {
      this.renderedSVG.attr("width", this.originalWidth);
      this.renderedSVG.attr("height", this.originalHeight);
      this.renderedSVG.css("zoom", factor);
    }
    this.resetZoomButton.text(`${Math.round(factor * 100)}%`);
    this.zoomFactor = factor;
  }

  resetZoom() {
    if (!(this.loaded && this.isVisible())) {
      return;
    }
    this.mode = "reset-zoom";
    this.zoomToFitButton.removeClass("selected");
    this.setZoom(1);
    this.resetZoomButton.text("100%");
  }

  determineZoomToFitFactor() {
    const scaleFactor = Math.min(
      this.imageContainer.context.clientWidth / this.renderedSVG[0].clientWidth,
      this.imageContainer.context.clientHeight /
        this.renderedSVG[0].clientHeight
    );
    return Math.min(scaleFactor, 1);
  }

  zoomToFit() {
    if (!(this.loaded && this.isVisible())) {
      return;
    }
    this.setZoom(1);
    this.mode = "zoom-to-fit";
    this.imageContainer.addClass("zoom-to-fit");
    this.zoomToFitButton.addClass("selected");
    this.renderedSVG.attr("width", "100%");
    this.renderedSVG.attr(
      "height",
      this.renderedSVG[0].clientHeight * this.determineZoomToFitFactor()
    );
    this.resetZoomButton.text("Auto");
  }

  zoomToWidth() {
    if (!(this.loaded && this.isVisible())) {
      return;
    }
    this.setZoom(
      this.imageContainer.context.clientWidth / this.renderedSVG[0].clientWidth
    );
    this.resetZoomButton.text("Auto");
    this.zoomToFitButton.removeClass("selected");
  }

  zoomToHeight() {
    if (!(this.loaded && this.isVisible())) {
      return;
    }
    this.setZoom(
      this.imageContainer.context.clientHeight /
        this.renderedSVG[0].clientHeight
    );
    this.resetZoomButton.text("Auto");
    this.zoomToFitButton.removeClass("selected");
  }

  changeBackground(color) {
    if (!(this.loaded && this.isVisible() && color)) {
      return;
    }
    this.imageContainer.attr("background", color);
  }
}

/* eslint no-invalid-this: 0 */
/* eslint max-len: 0 */
