"use babel";
const MAX_SIGNED_SHORT = 32767;

const COMPRESSION_RATIO = 0.8;
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
export default function svgToRaster(
  pSVG,
  pCallback,
  pRasterType = "image/png"
) {
  const lImg = document.createElement("img");

  lImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pSVG)}`;

  lImg.addEventListener("load", function imageEventListener(pEvent) {
    const lImage = pEvent.target;

    if (lImage.width > MAX_SIGNED_SHORT || lImage.height > MAX_SIGNED_SHORT) {
      // We're using canvas - which can handle ~32kx32k bitmaps,
      // but (in v8) not bigger ones
      pCallback(null, new Error("image-too-big"));
    } else {
      // create an (undisplayed) canvas
      const lCanvas = document.createElement("canvas");

      // resize the canvas to the size of the image
      lCanvas.width = lImage.width;
      lCanvas.height = lImage.height;

      // ... and draw the image on there
      lCanvas.getContext("2d").drawImage(lImage, 0, 0);

      // smurf the data url of the canvas
      const lDataURL = lCanvas.toDataURL(pRasterType, COMPRESSION_RATIO);

      // extract the base64 encoded image, decode and return it
      pCallback(
        Buffer.from(
          lDataURL.replace(`data:${pRasterType};base64,`, ""),
          "base64"
        )
      );
    }
  });
}
