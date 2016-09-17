deHTMLize = (pString) ->
  pString.replace /</g, "&lt;"

renderErrorIntro = (pErrorLocation, pMessage) ->
  if pErrorLocation
    "error on line #{pErrorLocation.start.line}, column #{pErrorLocation.start.column}"
  else
    "error"

formatNumber = (pNumber, pMaxWidth) ->
  lRetval = pNumber.toString()
  lRetval = " ".repeat(pMaxWidth - lRetval.length) + lRetval + " "

underlineCol = (pLine, pCol) ->
  return deHTMLize pLine if pCol is undefined

  lUnderlinalized = pLine.split("").reduce ((pPrev, pChar, pIndex) ->
    if pIndex == pCol
      "#{pPrev}<span style='text-decoration:underline'>#{deHTMLize pChar}</span>"
    else
      pPrev + deHTMLize pChar
  ), ""

  "<mark>#{ lUnderlinalized }</mark>"

formatLine = (pLine, pIndex, pCol) ->
  "#{formatNumber pIndex, 3}#{underlineCol pLine, pCol}"

renderCode = (pSource, pErrorLocation) ->
  return if not pSource

  pSource.split('\n').reduce ((pPrev, pLine, pIndex) ->
    if pErrorLocation and (pIndex == (pErrorLocation.start.line - 1))
      pPrev + '\n' + formatLine(pLine, pIndex + 1, pErrorLocation.start.column - 1)
    else
      pPrev + '\n' + formatLine(pLine, pIndex + 1)
  ), ""

module.exports =

  renderError: (pSource, pErrorLocation, pMessage) ->
    "<div class='error-wrap'>
      <div class='block error-head'>
        <span class='inline-block icon icon-flame highlight'>#{ renderErrorIntro pErrorLocation, pMessage }</span>
        <span class='error-text'>#{ pMessage }</span>
      </div>
      <pre class='code'>#{ renderCode pSource, pErrorLocation }</pre>
    </div>"
