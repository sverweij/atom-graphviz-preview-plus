spawn = require('child_process').spawn

exports.render = (pDot, pCallback, pOptions) ->
  lOptions = Object.assign({outputType: 'svg', engine: 'dot', exec: 'dot'}, pOptions)
  dot = spawn(lOptions.exec, ["-T#{lOptions.outputType}", "-K#{lOptions.engine}"])
  lData = ''
  lError = null

  dot.stdin.write(pDot)
  dot.stdin.end()

  dot.stdout.on('data', (pData) -> lData += pData)

  dot.stderr.on('data', (pError) -> lError = pError)

  dot.on('error', (pError) -> lError = pError)

  dot.on 'close', (pCode) ->
     #  0: okeleedokelee
     #  1: error in the program
     # -2: executable not found
    if (pCode == 0)
      pCallback(null, lData)
    else if (lError)
      if (lError instanceof Buffer)
        pCallback({message: lError.toString('utf8')})
      else
        pCallback({message: lError})
    else
      pCallback({message: "Unexpected error occurred. Exit code #{pCode}"})
