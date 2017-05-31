function formatNumber(pNumber, pMaxWidth) {
    let lRetval = "";
    if (!pNumber) {
        return "";
    }
    lRetval = pNumber.toString();
    return lRetval = " ".repeat(pMaxWidth - lRetval.length) + lRetval + " ";
}

function formatLine(pLine, pIndex) {
    return `${formatNumber(pIndex, 3)}${pLine}`;
}

function getLineNumber(pErrorString) {
    const re = /(Error: syntax error in line )([0-9]+)( near .*)/gi;
    const results = re.exec(pErrorString);

    if (results && results.length === 4) {
        return parseInt(results[2], 10);
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
    return pSource.split('\n').reduce(((pPrev, pLine, pIndex) => {
        if (lLineNumber && (pIndex === lLineNumber - 1)) {
            return pPrev + '\n' + formatLine(`<mark>${pLine}</mark>`, pIndex + 1);
        } else {
            return pPrev + '\n' + formatLine(pLine, pIndex + 1);
        }
    }), "");
}

exports.renderError = (pSource, pMessage) =>
    `<div class='error-wrap'>
        <div class='block error-head'>
            <span class='inline-block icon icon-flame highlight'>error</span>
            <span class='error-text'>${pMessage}</span>
        </div>
        <pre class='code'>${renderCode(pSource, pMessage)}</pre>
    </div>`;
