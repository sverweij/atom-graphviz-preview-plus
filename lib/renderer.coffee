viz = null # Defer until used

exports.render = (pScript='', pCallback, pRetry=false) ->
  viz ?= require 'viz.js'

  lOptions =
    format : 'svg'
    engine : atom.config.get('graphviz-preview-plus.layoutEngine') or 'dot'

  try
    lResult = viz pScript, lOptions
    pCallback null, lResult
  catch error
    # workaround for https://github.com/mdaines/viz.js/issues/59
    # - viz.js gets into an unrecoverable state when presented with a graphviz
    #   source containing unclosed strings(e.g. `graph {a[label="unclosed]}`)
    # - the only solution seems to be to re-load viz.js
    # - just setting it to null is not enough - node keeps viz.js
    #   _including its unrecoverable state_ in a cache - so require'ing
    #   it would re-create the problem
    # - hence the explicit cache deletion (which makes the next
    #   "require 'viz.js'" slow)
    # - after that we retry the render
    if pRetry == false and typeof error == 'string' and error == "Error: syntax error in line 1 near '\"'\n"
      viz = null
      delete require.cache[require.resolve('viz.js')]
      exports.render(pScript, pCallback, true)
    else
      pCallback {message: error}
