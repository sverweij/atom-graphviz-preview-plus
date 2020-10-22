"use babel";
/* eslint-disable no-magic-numbers */
import _ from "underscore-plus";

const ASSUMED_MAX_NUMBER_WIDTH = 3;

function formatNumber(pNumber, pMaxWidth) {
  let lReturnValue = "";
  if (!pNumber) {
    return "";
  }
  lReturnValue = pNumber.toString();
  return (lReturnValue = `${" ".repeat(
    pMaxWidth - lReturnValue.length
  )}${lReturnValue} `);
}

function formatLine(pLine, pIndex) {
  return `${formatNumber(pIndex, ASSUMED_MAX_NUMBER_WIDTH)}${pLine}`;
}

function getLineNumber(pErrorString) {
  const lRe = /(Error: syntax error in line )([0-9]+)( near .*)/gi;
  const results = lRe.exec(pErrorString);

  if (results && results.length === 4) {
    return Number.parseInt(results[2], 10);
  } else {
    return null;
  }
}

function renderCode(pSource, pMessage) {
  if (!pSource) {
    return null;
  }
  let lLineNumber = null;
  if (pMessage) {
    lLineNumber = getLineNumber(pMessage);
  }
  return pSource.split("\n").reduce((pPrevious, pLine, pIndex) => {
    if (lLineNumber && pIndex === lLineNumber - 1) {
      return `${pPrevious}\n${formatLine(`<mark>${pLine}</mark>`, pIndex + 1)}`;
    } else {
      return `${pPrevious}\n${formatLine(pLine, pIndex + 1)}`;
    }
  }, "");
}

export default (pSource, pMessage) =>
  `<div class='error-wrap'>
        <div class='block error-head'>
            <span class='inline-block icon icon-flame highlight'>error</span>
            <span class='error-text'>${_.escape(pMessage)}</span>
        </div>
        <pre class='code'>${_.escape(renderCode(pSource, pMessage))}</pre>
    </div>`;
