"use babel";

let resolveImage = null;

/**
 * GraphViz incorrectly renders SVG's in case there's a dpi !== the
 * default (72) in the input dot. Root cause is that the viewBox doesn't
 * get resized, while width, height and the main `g`'s scale are.
 *
 * This function corrects that by setting the viewBox to the width and
 * height of the svg.
 *
 * Additional complexity: GraphViz uses pt as unit in the width & height.
 * It uses those numbers 1:1 width & height in the viewBox. However, viewBox
 * unit's are not points. So the SVG GraphViz outputs is always slightly
 * bigger than it should be. graphviz-preview-plus does not interfere in
 * that behavior.
 *
 * @param  {object} pRenderedSVG the (jQuery object wrapped) SVG as rendered
 *                               by GraphViz
 * @return {nothing}             This function _directly_ manipulates the
 *                               input SVG
 */
export function correctViewBox(pRenderedSVG) {
    const lWidth = Number.parseFloat(pRenderedSVG.attr("width"));
    const lHeight = Number.parseFloat(pRenderedSVG.attr("height"));

    // should have been able to use pRenderedSVG.attr to set the viewBox,
    // however that (jQuery) function executes a toLowerCase (or similar),
    // As svg attributes are case sensitive this doesn't have any effect.
    // Hence direct DOM manipulation:
    const lRenderedSVGDOMElement = pRenderedSVG.get()[0];
    lRenderedSVGDOMElement.setAttribute("viewBox", `0 0 ${lWidth} ${lHeight}`);
}

/**
 * Usualy links in html in atom preview windows are clickable. However,
 * correct links in svg (in the xlink namespace) aren't, whereas other
 * browser implementations do.
 *
 * This is a workaround for that limitation. It adds a `href` attribute
 * to each `a` in the svg in the preview window (_not_ to the exported svg!)
 * that has an`xlink:href` attribute.
 *
 * @param  {object} pRenderedSVG the (jQuery object wrapped) SVG as rendered
 *                               by GraphViz
 * @return {nothing}             This function _directly_ manipulates the
 *                               input SVG
 */
export function makeLinksClickable(pRenderedSVG) {
    pRenderedSVG.find("a").each(function() {
        if (Boolean(this.getAttribute("xlink:href"))) {
            this.setAttribute("href", this.getAttribute("xlink:href"));
        }
    });
}

/**
 * GraphViz sometimes uses non-breaking spaces in its SVG. Strict(er) SVG
 * render programs will bork on this, nbsp's are not defined in XML and hence
 * not in SVG either. Samples of these stricter programs are safari and
 * chrome's canvas implementation (probably because html entites don't leak
 * into those contexts).
 *
 * There's two ways around it; define the entity (like
 * we do in this function) or replace all nbsp entities with &#160.
 *
 * Should we have more entities defined here? In theory: yes. In practice: no.
 * strictly html entities like &copy; _do not_ make these same interpreters
 * choke - until further notice
 *
 * @param  {string} pSVG the svg as a string
 * @return {string}      the same svg, but with the nbsp entity
 *                       definition kitted in front of it iff
 *                       &nbsp; is anywhere in it
 */
export function defineEntities(pSVG) {
    if (pSVG.indexOf('&nbsp;') > -1){
        return `<!DOCTYPE svg [<!ENTITY nbsp "&#160;">]>${pSVG}`;
    }
    return pSVG;
}

/**
 * workaround for
 * https://github.com/sverweij/atom-graphviz-preview-plus/issues/14
 *
 * @param  {object} pRenderedSVG      the (jQuery object wrapped) SVG as rendered
 *                                    by GraphViz
 * @param  {string} pWorkingDirectory the working directory for the images
 * @return {nothing}                  (pRenderedSVG is manipulated directly)
 */
export function resolveImages(pRenderedSVG, pWorkingDirectory) {
    const lImages = pRenderedSVG.find('image');
    if (Boolean(lImages) && resolveImage === null) {
        resolveImage = require('./resolveImage');
    }
    for (let i = 0; i < lImages.length; i++) {
        lImages[i].href.baseVal = resolveImage(lImages[i].href.baseVal, pWorkingDirectory);
    }
}

/* because it's how jQuery does things we'll alow that interesting 'this' for now */
/* eslint no-invalid-this:0, security/detect-object-injection: 0 */
