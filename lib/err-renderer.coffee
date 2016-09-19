deHTMLize = (pString) ->
  pString.replace /</g, "&lt;"

formatNumber = (pNumber, pMaxWidth) ->
  lRetval = pNumber.toString()
  lRetval = " ".repeat(pMaxWidth - lRetval.length) + lRetval + " "

formatLine = (pLine, pIndex, pCol) ->
  "#{formatNumber pIndex, 3}#{ pLine }"

getLineNumber = (pErrorString) ->
  re=/(Error: syntax error in line )([0-9]+)( near .*)/gi
  results=re.exec(pErrorString)
  if results and results.length == 4
    return parseInt results[2]
  else
    return null

renderCode = (pSource, pMessage) ->
  return if not pSource
  lLineNumber = null

  if pMessage
    lLineNumber = getLineNumber pMessage

  pSource.split('\n').reduce ((pPrev, pLine, pIndex) ->
    if lLineNumber and (pIndex == lLineNumber - 1)
      pPrev + '\n' + formatLine("<mark>#{ pLine }</mark>", pIndex + 1)
    else
      pPrev + '\n' + formatLine(pLine, pIndex + 1)
  ), ""

module.exports =

  renderError: (pSource, pMessage) ->
    "<div class='error-wrap'>
      <div class='block error-head'>
        <span class='inline-block icon icon-flame highlight'>error</span>
        <span class='error-text'>#{ pMessage }</span>
      </div>
      <pre class='code'>#{ renderCode pSource, pMessage }</pre>
    </div>"
