"use babel";

import {resolveImage} from '../lib/resolveImage';
import * as path from 'path';

describe("image resolver", () => {
    it("puts the working directory in front of relative paths", () => {
        expect(
            resolveImage('top-button.png', '/Users/christiaanhuygens/picturesofbuttons')
        ).toEqual(path.join(path.sep, 'Users', 'christiaanhuygens', 'picturesofbuttons', 'top-button.png'));
    });

    it("leaves absolute paths alone", () => {
        expect(
            resolveImage('/Users/marinmersenne/top-button.png', '/Users/christiaanhuygens/picturesofbuttons')
        ).toEqual('/Users/marinmersenne/top-button.png');
    });

    it("leaves atom resource urls alone", () => {
        expect(
            resolveImage(
                'atom://graphviz-preview-plus/assets/transparent-background.png',
                '/Users/christiaanhuygens/picturesofbuttons'
            )
        ).toEqual('atom://graphviz-preview-plus/assets/transparent-background.png');
    });

    it("leaves http urls alone", () => {
        expect(
            resolveImage(
                'https://upload.wikimedia.org/wikipedia/commons/7/73/Frans_Hals_-_Portret_van_René_Descartes.jpg',
                '/Users/christiaanhuygens/picturesofbuttons'
            )
        ).toEqual('https://upload.wikimedia.org/wikipedia/commons/7/73/Frans_Hals_-_Portret_van_René_Descartes.jpg');
    });

    it("leaves file urls alone", () => {
        expect(
            resolveImage(
                'file:///Applications/Atom/Contents/Resources/app/static/neuzel.png',
                '/Users/christiaanhuygens/picturesofbuttons'
            )
        ).toEqual('file:///Applications/Atom/Contents/Resources/app/static/neuzel.png');
    });

});
