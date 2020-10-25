"use babel";
/* eslint-disable node/no-unsupported-features/es-syntax */
import path from "path";

const imagePathIsAbsolute = (pImagePath) =>
  path.isAbsolute(pImagePath) || pImagePath.match(/^(https?|atom|file):\/\//);

/**
 * resolves the given path to an image (in pImagePath) following these rules
 * - return pImagePath if it's absolute, or adheres to of http or atom uri scheme
 * - join the pReferencePath and the pImagePath in all other cases
 *
 * @param  {string} pImagePath     path to the image as a string
 * @param  {string} pReferencePath reference path/ working directory to use
 * @return {string}                see above
 */
export default function resolveImage(pImagePath, pReferencePath) {
  return imagePathIsAbsolute(pImagePath)
    ? pImagePath
    : path.join(pReferencePath, pImagePath);
}
