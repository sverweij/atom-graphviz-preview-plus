"use babel";

/**
 * Transforms the given svg to a raster graphic.
 *
 * Uses a canvas to do so. Needs direct access to a DOM.
 *
 * @param  {string} pSVG                      The SVG to transform
 * @param  {function} pCallback               function that takes the transformed
 *                                            raster graphic as a parameter
 * @param  {String} [pRasterType='image/png'] The mime type of the raster to
 *                                            transform to. Which mime types
 *                                            are supported depends on the
 *                                            environment the function runs in,
 *                                            typically 'image/png', 'image/jpeg'
 *                                            in some environments also 'image/webp'
 */
export default function (pSVG, pCallback, pRasterType = 'image/png') {

    const lImg = document.createElement('img');

    lImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pSVG)}`;

    lImg.addEventListener('load', function (pEvent) {

        // create an (undisplayed) canvas
        const lCanvas = document.createElement('canvas');
        const lImage  = pEvent.target;

        // resize the canvas to the size of the image
        lCanvas.width  = lImage.width;
        lCanvas.height = lImage.height;

        // ... and draw the image on there
        lCanvas.getContext('2d').drawImage(lImage, 0, 0);

        // smurf the data url of the canvas
        const lDataURL = lCanvas.toDataURL(pRasterType, 0.8);

        // extract the base64 encoded image, decode and return it
        pCallback(
            Buffer.from(
                lDataURL.replace(`data:${pRasterType};base64,`, ''),
                'base64'
            )
        );
    });
}
