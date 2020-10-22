"use babel";

/* eslint-disable no-magic-numbers */

import path from "path";
import fs from "fs-plus";
import temp from "temp";
import GraphVizPreviewView from "../lib/graphviz-preview-plus-view.js";
import { makeSureGrammarExists } from "./grammar-helper.js";

describe("graphviz preview plus package view", () => {
  let lPreview = null;
  let lWorkspaceElement = null;

  beforeEach(function setUp() {
    this.grammarDisposable = makeSureGrammarExists();
    const filePath = atom.project
      .getDirectories()[0]
      .resolve("subdir/asample.gv");
    lPreview = new GraphVizPreviewView({
      filePath,
    });
    jasmine.attachToDOM(lPreview.element);
    waitsForPromise(() =>
      atom.packages.activatePackage("graphviz-preview-plus")
    );
  });

  afterEach(function cleanUp() {
    lPreview.destroy();
    if (this.grammarDisposable) {
      this.grammarDisposable.dispose();
    }
    lPreview = null;
    lWorkspaceElement = null;
  });

  describe("::constructor", () =>
    it("shows a loading spinner and renders the dot", () => {
      lPreview.showLoading();
      expect(lPreview.find(".dot-spinner")).toExist();
      waitsForPromise(() => lPreview.renderDot());
    }));

  describe("serialization", () => {
    it("recreates the lPreview when serialized/deserialized", () => {
      const preview = atom.deserializers.deserialize(lPreview.serialize());

      jasmine.attachToDOM(preview.element);
      expect(preview.getPath()).toBe(lPreview.getPath());

      if (preview !== null) {
        preview.destroy();
      }
    });
  });

  describe("when core:copy is triggered", () => {
    beforeEach(() => {
      const fixturesPath = path.join(__dirname, "fixtures");
      const temporaryPath = temp.mkdirSync("atom");

      fs.copySync(fixturesPath, temporaryPath);
      atom.project.setPaths([temporaryPath]);
      jasmine.useRealClock();
      lWorkspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(lWorkspaceElement);
      atom.clipboard.write("initial clipboard content");
    });
    it("writes the rendered SVG to the clipboard", () => {
      let lPreviewPaneItem = null;

      waitsForPromise(() => atom.workspace.open("subdir/序列圖.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      waitsFor(
        () => (lPreviewPaneItem = atom.workspace.getPanes()[1].getActiveItem())
      );
      runs(() => atom.commands.dispatch(lPreviewPaneItem.element, "core:copy"));
      waitsFor(() => atom.clipboard.read() !== "initial clipboard content");
      return runs(() => expect(atom.clipboard.read()).toContain("<svg "));
    });
  });

  describe("zoom functions when there is nothing to zoom, really", () => {
    let lPreviewPaneItem = null;

    beforeEach(() => {
      const fixturesPath = path.join(__dirname, "fixtures");
      const temporaryPath = temp.mkdirSync("atom");

      fs.copySync(fixturesPath, temporaryPath);
      atom.project.setPaths([temporaryPath]);
      jasmine.useRealClock();
      lWorkspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(lWorkspaceElement);
      waitsForPromise(() => atom.workspace.open("subdir/error-in-line-3.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      waitsFor(
        () => (lPreviewPaneItem = atom.workspace.getPanes()[1].getActiveItem())
      );
    });

    it("graphviz-preview-plus:zoom-in does nothing", () => {
      let lThingsThrown = "zoom operation did not throw an error";

      try {
        atom.commands.dispatch(
          lPreviewPaneItem.element,
          "graphviz-preview-plus:zoom-in"
        );
      } catch (pError) {
        lThingsThrown = "zoom operation threw an error";
      }
      expect(lThingsThrown).toBe("zoom operation did not throw an error");
    });
  });

  describe("zoom functions", () => {
    let lPreviewPaneItem = null;

    beforeEach(() => {
      const fixturesPath = path.join(__dirname, "fixtures");
      const temporaryPath = temp.mkdirSync("atom");

      fs.copySync(fixturesPath, temporaryPath);
      atom.project.setPaths([temporaryPath]);
      jasmine.useRealClock();
      lWorkspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(lWorkspaceElement);
      waitsForPromise(() => atom.workspace.open("subdir/序列圖.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      waitsFor(
        () => (lPreviewPaneItem = atom.workspace.getPanes()[1].getActiveItem())
      );
    });
    it("3x graphviz-preview-plus:zoom-in increases the image size by 30%", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-in"
      );
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-in"
      );
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-in"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(lSvg.style.zoom).toBe("1.3");
    });
    it("2x graphviz-preview-plus:zoom-out decreases the image size by 20%", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-out"
      );
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-out"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(lSvg.style.zoom).toBe("0.8");
    });
    it("graphviz-preview-plus:reset-zoom resets zoom after size change", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-out"
      );
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:reset-zoom"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(lSvg.style.zoom).toBe("1");
    });
    it("graphviz-preview-plus:reset-zoom resets zoom after zoom-to-fit", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-to-fit"
      );
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:reset-zoom"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(lSvg.style.zoom).toBe("1");
      expect(lSvg.getAttribute("width")).toBe("199pt");
    });
    it("graphviz-preview-plus:reset-zoom resets zoom after zoom-to-width", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-to-width"
      );
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:reset-zoom"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(lSvg.style.zoom).toBe("1");
      expect(lSvg.getAttribute("width")).toBe("199pt");
    });
    it("graphviz-preview-plus:zoom-to-fit zooms to fit", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-to-fit"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(Number.parseFloat(lSvg.style.zoom, 10)).toBe(1);
      expect(lSvg.getAttribute("width")).toBe("100%");
    });
    it("graphviz-preview-plus:zoom-to-width zooms to width", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-to-width"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];

      // the actual zoom factor depends on the platform, so
      // putting an exact number here will make it pass on one
      // and fail on other platforms
      expect(Number.parseFloat(lSvg.style.zoom, 10)).toBeGreaterThan(1.3);
    });
    it("graphviz-preview-plus:zoom-to-height zooms to height", () => {
      atom.commands.dispatch(
        lPreviewPaneItem.element,
        "graphviz-preview-plus:zoom-to-height"
      );
      const lSvg = lPreviewPaneItem.imageContainer.find("svg")[0];
      expect(lSvg.style.zoom).toBe("0");
    });
  });

  describe("when core:save-as is triggered", () => {
    beforeEach(() => {
      const fixturesPath = path.join(__dirname, "fixtures");
      const temporaryPath = temp.mkdirSync("atom");

      fs.copySync(fixturesPath, temporaryPath);
      atom.project.setPaths([temporaryPath]);
      jasmine.useRealClock();
      lWorkspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(lWorkspaceElement);
    });
    xit("saves an SVG and opens it => test this manually", async () => {
      const outputPath = `${temp.path()}subdir/序列圖.svg`;
      let lPreviewPaneItem = null;

      waitsForPromise(() => atom.workspace.open("subdir/序列圖.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      waitsFor(
        () => (lPreviewPaneItem = atom.workspace.getPanes()[1].getActiveItem())
      );
      runs(() => {
        spyOn(atom.applicationDelegate, "showSaveDialog").andReturn(outputPath);
        atom.commands.dispatch(lPreviewPaneItem.element, "core:save-as");
      });
      waitsFor(() => fs.existsSync(outputPath));
      runs(() => {
        expect(fs.isFileSync(outputPath)).toBe(true);
        const writtenFile = fs.readFileSync(outputPath);
        expect(writtenFile).toContain("<svg ");
      });
    });
    xit("saves a PNG and opens it => test this manually", () => {
      const outputPath = `${temp.path()}subdir/序列圖.png`;
      let lPreviewPaneItem = null;

      waitsForPromise(() => atom.workspace.open("subdir/序列圖.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      waitsFor(
        () => (lPreviewPaneItem = atom.workspace.getPanes()[1].getActiveItem())
      );
      runs(() => {
        spyOn(atom, "showSaveDialogSync").andReturn(outputPath);
        atom.commands.dispatch(
          lPreviewPaneItem.element,
          "graphviz-preview-plus:save-as-png"
        );
      });
      waitsFor(() => fs.existsSync(outputPath));
      runs(() => {
        expect(fs.isFileSync(outputPath)).toBe(true);
        const writtenFile = fs.readFileSync(outputPath);
        expect(writtenFile).toContain("PNG");
      });
    });
  });
});
/* global atom */
/* eslint no-invalid-this: 0 */
