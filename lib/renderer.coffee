viz = null # Defer until used

exports.render = (pScript='', pCallback) ->
  viz ?= require 'viz.js'

  lOptions =
    format : 'svg'
    engine : atom.config.get('graphviz-preview-plus.layoutEngine') or 'dot'

  try
    lResult = viz pScript, lOptions
    pCallback null, lResult
  catch error
    pCallback {message: error}
