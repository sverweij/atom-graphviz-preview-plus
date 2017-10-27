"use babel";

import path from 'path';
import fs from 'fs-plus';
import temp from 'temp';
import GraphVizPreviewView from '../lib/graphviz-preview-plus-view';
import {makeSureGrammarExists} from './grammarHelper';

describe("graphviz preview plus package view", () => {
    let preview = null;
    let workspaceElement = null;

    beforeEach(function() {
        this.grammarDisposable = makeSureGrammarExists();
        const filePath = atom.project.getDirectories()[0].resolve('subdir/asample.gv');
        preview = new GraphVizPreviewView({
            filePath
        });
        jasmine.attachToDOM(preview.element);
        return waitsForPromise(() => atom.packages.activatePackage("graphviz-preview-plus"));
    });
    afterEach(function() {
        preview.destroy();
        if (this.grammarDisposable) {
            this.grammarDisposable.dispose();
        }
        preview = null;
        workspaceElement = null;
    });
    describe("::constructor", () => it("shows a loading spinner and renders the dot", () => {
        preview.showLoading();
        expect(preview.find('.dot-spinner')).toExist();
        waitsForPromise(() => preview.renderDot());
    }));
    describe("serialization", () => {
        let newPreview = null;

        afterEach(() => {
            if (newPreview !== null) {
                newPreview.destroy();
            }
        });

        it("recreates the preview when serialized/deserialized", () => {
            newPreview = atom.deserializers.deserialize(preview.serialize());
            jasmine.attachToDOM(newPreview.element);
            return expect(newPreview.getPath()).toBe(preview.getPath());
        });
        it("serializes the editor id when opened for an editor", () => {
            preview.destroy();
            waitsForPromise(() => atom.workspace.open('new.gv'));
            return runs(() => {
                preview = new GraphVizPreviewView({
                    editorId: atom.workspace.getActiveTextEditor().id
                });
                jasmine.attachToDOM(preview.element);
                expect(preview.getPath()).toBe(atom.workspace.getActiveTextEditor().getPath());
                newPreview = atom.deserializers.deserialize(preview.serialize());
                jasmine.attachToDOM(newPreview.element);
                return expect(newPreview.getPath()).toBe(preview.getPath());
            });
        });
    });
    describe("when core:copy is triggered", () => {
        beforeEach(() => {
            const fixturesPath = path.join(__dirname, 'fixtures');
            const tempPath = temp.mkdirSync('atom');

            fs.copySync(fixturesPath, tempPath);
            atom.project.setPaths([tempPath]);
            jasmine.useRealClock();
            workspaceElement = atom.views.getView(atom.workspace);
            jasmine.attachToDOM(workspaceElement);
            atom.clipboard.write("initial clipboard content");
        });
        it("writes the rendered SVG to the clipboard", () => {
            let previewPaneItem = null;

            waitsForPromise(() => atom.workspace.open('subdir/序列圖.gv'));
            runs(() => atom.commands.dispatch(workspaceElement, 'graphviz-preview-plus:toggle'));
            waitsFor(() => previewPaneItem = atom.workspace.getPanes()[1].getActiveItem());
            runs(() => atom.commands.dispatch(previewPaneItem.element, 'core:copy'));
            waitsFor(() => atom.clipboard.read() !== "initial clipboard content");
            return runs(() => expect(atom.clipboard.read()).toContain("<svg "));
        });
    });
    describe("zoom functions when there is nothing to zoom, really", () => {
        let previewPaneItem = null;

        beforeEach(() => {
            const fixturesPath = path.join(__dirname, 'fixtures');
            const tempPath = temp.mkdirSync('atom');

            fs.copySync(fixturesPath, tempPath);
            atom.project.setPaths([tempPath]);
            jasmine.useRealClock();
            workspaceElement = atom.views.getView(atom.workspace);
            jasmine.attachToDOM(workspaceElement);
            waitsForPromise(() => atom.workspace.open('subdir/error-in-line-3.gv'));
            runs(() => atom.commands.dispatch(workspaceElement, 'graphviz-preview-plus:toggle'));
            waitsFor(() => previewPaneItem = atom.workspace.getPanes()[1].getActiveItem());
        });

        it("graphviz-preview-plus:zoom-in does nothing", () => {
            let lThingsThrown = "zoom operation did not throw an error";

            try {
                atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-in');
            } catch (e) {
                lThingsThrown = "zoom operation threw an error";
            }
            expect(lThingsThrown).toBe("zoom operation did not throw an error");
        });
    });

    describe("zoom functions", () => {
        let previewPaneItem = null;

        beforeEach(() => {
            const fixturesPath = path.join(__dirname, 'fixtures');
            const tempPath = temp.mkdirSync('atom');

            fs.copySync(fixturesPath, tempPath);
            atom.project.setPaths([tempPath]);
            jasmine.useRealClock();
            workspaceElement = atom.views.getView(atom.workspace);
            jasmine.attachToDOM(workspaceElement);
            waitsForPromise(() => atom.workspace.open('subdir/序列圖.gv'));
            runs(() => atom.commands.dispatch(workspaceElement, 'graphviz-preview-plus:toggle'));
            waitsFor(() => previewPaneItem = atom.workspace.getPanes()[1].getActiveItem());
        });
        it("3x graphviz-preview-plus:zoom-in increases the image size by 30%", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-in');
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-in');
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-in');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('1.3');
        });
        it("2x graphviz-preview-plus:zoom-out decreases the image size by 20%", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-out');
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-out');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('0.8');
        });
        it("graphviz-preview-plus:reset-zoom resets zoom after size change", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-out');
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:reset-zoom');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('1');
        });
        it("graphviz-preview-plus:reset-zoom resets zoom after zoom-to-fit", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-to-fit');
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:reset-zoom');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('1');
            expect(lSvg.getAttribute('width')).toBe('199pt');
        });
        it("graphviz-preview-plus:reset-zoom resets zoom after zoom-to-width", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-to-width');
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:reset-zoom');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('1');
            expect(lSvg.getAttribute('width')).toBe('199pt');
        });
        it("graphviz-preview-plus:zoom-to-fit zooms to fit", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-to-fit');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('1');
            expect(lSvg.getAttribute('width')).toBe('100%');
        });
        it("graphviz-preview-plus:zoom-to-width zooms to width", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-to-width');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBeGreaterThan('1.3'); // the actual zoom factor depends on the platform
        });
        it("graphviz-preview-plus:zoom-to-height zooms to height", () => {
            atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:zoom-to-height');
            const lSvg = previewPaneItem.imageContainer.find('svg')[0];
            expect(lSvg.style.zoom).toBe('0');
        });
    });
    describe("when core:save-as is triggered", () => {
        beforeEach(() => {
            const fixturesPath = path.join(__dirname, 'fixtures');
            const tempPath = temp.mkdirSync('atom');

            fs.copySync(fixturesPath, tempPath);
            atom.project.setPaths([tempPath]);
            jasmine.useRealClock();
            workspaceElement = atom.views.getView(atom.workspace);
            jasmine.attachToDOM(workspaceElement);
        });
        it("saves an SVG and opens it", () => {
            const outputPath = `${temp.path()}subdir/序列圖.svg`;
            let previewPaneItem = null;

            waitsForPromise(() => atom.workspace.open('subdir/序列圖.gv'));
            runs(() => atom.commands.dispatch(workspaceElement, 'graphviz-preview-plus:toggle'));
            waitsFor(() => previewPaneItem = atom.workspace.getPanes()[1].getActiveItem());
            runs(() => {
                spyOn(atom, 'showSaveDialogSync').andReturn(outputPath);
                atom.commands.dispatch(previewPaneItem.element, 'core:save-as');
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
            let previewPaneItem = null;

            waitsForPromise(() => atom.workspace.open('subdir/序列圖.gv'));
            runs(() => atom.commands.dispatch(workspaceElement, 'graphviz-preview-plus:toggle'));
            waitsFor(() => previewPaneItem = atom.workspace.getPanes()[1].getActiveItem());
            runs(() => {
                spyOn(atom, 'showSaveDialogSync').andReturn(outputPath);
                atom.commands.dispatch(previewPaneItem.element, 'graphviz-preview-plus:save-as-png');
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
/* global atom waitsForPromise*/
/* eslint no-invalid-this: 0 */
