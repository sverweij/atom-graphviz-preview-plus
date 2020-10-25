"use babel";

import path from "path";
import fs from "fs-plus";
import temp from "temp";
import GraphVizPreviewView from "../lib/graphviz-preview-plus-view.js";
import { makeSureGrammarExists } from "./grammar-helper.js";

describe("graphviz preview plus package main", () => {
  let lExpectPreviewInSplitPane = null;
  let lPreview = null;
  let lWorkspaceElement = null;
  beforeEach(function setUp() {
    this.grammarDisposable = makeSureGrammarExists();
    const fixturesPath = path.join(__dirname, "fixtures");
    const temporaryPath = temp.mkdirSync("atom");
    fs.copySync(fixturesPath, temporaryPath);
    atom.project.setPaths([temporaryPath]);
    jasmine.useRealClock();
    lWorkspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(lWorkspaceElement);
    waitsForPromise(() =>
      atom.packages.activatePackage("graphviz-preview-plus")
    );
  });
  afterEach(function cleanUp() {
    if (this.grammarDisposable) {
      this.grammarDisposable.dispose();
    }
    lPreview = null;
    lWorkspaceElement = null;
  });
  lExpectPreviewInSplitPane = () => {
    runs(() => expect(atom.workspace.getPanes().length).toBeGreaterThan(1));
    waitsFor(
      "graphviz lPreview to be created",
      () => (lPreview = atom.workspace.getPanes()[1].getActiveItem())
    );
    runs(() => {
      expect(lPreview).toBeInstanceOf(GraphVizPreviewView);
    });
  };
  describe("when a lPreview has not been created for the file", () => {
    it("displays a graphviz lPreview in a split pane", () => {
      waitsForPromise(() => atom.workspace.open("subdir/demo.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      lExpectPreviewInSplitPane();
      runs(() => {
        const editorPane = atom.workspace.getPanes()[0];

        expect(editorPane.getItems().length).toBeGreaterThan(0);
        expect(editorPane.isActive()).toBe(true);
      });
    });
    describe("when the editor's path does not exist", () =>
      it("splits the current pane to the right with a graphviz lPreview for the file", () => {
        waitsForPromise(() => atom.workspace.open("new.gv"));
        runs(() =>
          atom.commands.dispatch(
            lWorkspaceElement,
            "graphviz-preview-plus:toggle"
          )
        );
        lExpectPreviewInSplitPane();
      }));
    describe("when the path contains a space", () =>
      it("renders the lPreview", () => {
        waitsForPromise(() =>
          atom.workspace.open("subdir/a test with filename spaces.gv")
        );
        runs(() =>
          atom.commands.dispatch(
            lWorkspaceElement,
            "graphviz-preview-plus:toggle"
          )
        );
        lExpectPreviewInSplitPane();
      }));
    describe("when the path contains non-ASCII characters", () =>
      it("renders the lPreview", () => {
        waitsForPromise(() => atom.workspace.open("subdir/序列圖.gv"));
        runs(() =>
          atom.commands.dispatch(
            lWorkspaceElement,
            "graphviz-preview-plus:toggle"
          )
        );
        lExpectPreviewInSplitPane();
      }));
  });
  describe("when a lPreview has been created for the file", () => {
    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open("subdir/a test with filename spaces.gv")
      );
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      lExpectPreviewInSplitPane();
    });
    it("closes the existing lPreview when toggle is triggered a second time on the editor", () => {
      atom.commands.dispatch(lWorkspaceElement, "graphviz-preview-plus:toggle");
      const lPanes = atom.workspace.getPanes();
      const editorPane = lPanes[0];
      const previewPane = lPanes[1];

      expect(editorPane.isActive()).toBe(true);
      expect(previewPane.getActiveItem()).toBeUndefined();
    });
    it("closes the existing lPreview when toggle is triggered on it and it has focus", () => {
      const previewPane = atom.workspace.getPanes()[1];

      previewPane.activate();
      atom.commands.dispatch(lWorkspaceElement, "graphviz-preview-plus:toggle");
      expect(previewPane.getActiveItem()).toBeUndefined();
    });
    describe("when the editor is modified", () => {
      it("re-renders the lPreview", () => {
        spyOn(lPreview, "showLoading");
        const mscEditor = atom.workspace.getActiveTextEditor();
        mscEditor.setText("a note a: made in Holland;");
        waitsFor(() => lPreview.text().includes("a note a: made in Holland;"));
        runs(() => expect(lPreview.showLoading).not.toHaveBeenCalled());
      });
      xit("invokes ::onDidChangeMsc listeners", () => {
        let lListener = null;
        const mscEditor = atom.workspace.getActiveTextEditor();

        lPreview.onDidChangeMsc(
          (lListener = jasmine.createSpy("didChangeMscListener"))
        );
        runs(() => mscEditor.setText("a note a: made in Holland;"));
        waitsFor(
          "::onDidChangeMsc handler to be called",
          () => lListener.callCount > 0
        );
      });
      describe("when the lPreview is in the active pane but is not the active item", () =>
        it("re-renders the lPreview but does not make it active", () => {
          const mscEditor = atom.workspace.getActiveTextEditor();
          const previewPane = atom.workspace.getPanes()[1];

          previewPane.activate();
          waitsForPromise(() => atom.workspace.open());
          runs(() => mscEditor.setText("a note a: made in Holland;"));
          waitsFor(() =>
            lPreview.text().includes("a note a: made in Holland;")
          );
          runs(() => {
            expect(previewPane.isActive()).toBe(true);
            expect(previewPane.getActiveItem()).not.toBe(lPreview);
          });
        }));
      describe("when the lPreview is not the active item and not in the active pane", () =>
        it("re-renders the lPreview and makes it active", () => {
          const mscEditor = atom.workspace.getActiveTextEditor();
          const lPanes = atom.workspace.getPanes();
          const editorPane = lPanes[0];
          const previewPane = lPanes[1];

          previewPane.splitRight({
            copyActiveItem: true,
          });
          previewPane.activate();
          waitsForPromise(() => atom.workspace.open());
          runs(() => {
            editorPane.activate();
            mscEditor.setText("a note a: made in Holland;");
          });
          waitsFor(() =>
            lPreview.text().includes("a note a: made in Holland;")
          );
          runs(() => {
            expect(editorPane.isActive()).toBe(true);
            expect(previewPane.getActiveItem()).toBe(lPreview);
          });
        }));
      describe("when the liveUpdate config is set to false", () =>
        it("only re-renders the graphviz when the editor is saved, not when the contents are modified", () => {
          atom.config.set("graphviz-preview-plus.liveUpdate", false);
          const didStopChangingHandler = jasmine.createSpy(
            "didStopChangingHandler"
          );

          atom.workspace
            .getActiveTextEditor()
            .getBuffer()
            .onDidStopChanging(didStopChangingHandler);
          atom.workspace.getActiveTextEditor().setText("ch ch changes");
          waitsFor(() => didStopChangingHandler.callCount > 0);
          runs(() => {
            expect(lPreview.text()).not.toContain("ch ch changes");
            atom.workspace.getActiveTextEditor().save();
          });
          waitsFor(() => lPreview.text().includes("ch ch changes"));
        }));
    });
  });
  describe("when the graphviz lPreview view is requested by file URI", () =>
    it("opens a lPreview editor and watches the file for changes", () => {
      waitsForPromise("atom.workspace.open promise to be resolved", () =>
        atom.workspace.open(
          `graphviz-preview-plus://${atom.project
            .getDirectories()[0]
            .resolve("subdir/atest.gv")}`
        )
      );
      runs(() => {
        lPreview = atom.workspace.getActivePaneItem();
        expect(lPreview).toBeInstanceOf(GraphVizPreviewView);
        spyOn(lPreview, "renderDotText");
        lPreview.file.emitter.emit("did-change");
      });
      waitsFor(
        "dot to be re-rendered after file changed",
        () => lPreview.renderDotText.callCount > 0
      );
    }));
  describe("when the editor's path changes on #win32 and #darwin", () => {
    if (process.platform === "win32") {
      expect("MS-DOS").toContain("DOS");
    } else {
      it("updates the lPreview's title", () => {
        const titleChangedCallback = jasmine.createSpy("titleChangedCallback");

        waitsForPromise(() => atom.workspace.open("subdir/atest.gv"));
        runs(() =>
          atom.commands.dispatch(
            lWorkspaceElement,
            "graphviz-preview-plus:toggle"
          )
        );
        lExpectPreviewInSplitPane();
        runs(() => {
          expect(lPreview.getTitle()).toContain("atest.gv preview+ (dot)");
          lPreview.onDidChangeTitle(titleChangedCallback);
          fs.renameSync(
            atom.workspace.getActiveTextEditor().getPath(),
            path.join(
              path.dirname(
                atom.workspace.getActiveTextEditor().getPath().toString()
              ),
              "atest2.gv"
            )
          );
        });
        waitsFor(() =>
          lPreview.getTitle().endsWith("atest2.gv preview+ (dot)")
        );
        runs(() => expect(titleChangedCallback).toHaveBeenCalled());
      });
    }
  });
  describe("when the URI opened does not have a graphviz-preview-plus protocol", () =>
    it("does not throw an error trying to decode the URI (regression)", () => {
      waitsForPromise(() => atom.workspace.open("%"));
      runs(() => expect(atom.workspace.getActiveTextEditor()).toBeTruthy());
    }));
  describe("sanitization", () =>
    it("removes script tags and attributes that commonly contain inline scripts", () => {
      waitsForPromise(() => atom.workspace.open("subdir/puthaken.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      lExpectPreviewInSplitPane();
      runs(() =>
        expect(lPreview[0].innerHTML).toContain(
          "<span class=\"error-text\">Error: syntax error in line 1 near '&gt;'\n</span>"
        )
      );
    }));
  describe("error rendering", () =>
    it("highlights the line with the error", () => {
      waitsForPromise(() => atom.workspace.open("subdir/error-in-line-3.gv"));
      runs(() =>
        atom.commands.dispatch(
          lWorkspaceElement,
          "graphviz-preview-plus:toggle"
        )
      );
      lExpectPreviewInSplitPane();
      runs(() =>
        expect(lPreview[0].innerHTML).toContain(
          "  3 &lt;mark&gt;  \\&lt;/mark&gt;"
        )
      );
    }));
});
/* global atom */
/* eslint no-invalid-this: 0 */
/* eslint max-nested-callbacks: 0 */
