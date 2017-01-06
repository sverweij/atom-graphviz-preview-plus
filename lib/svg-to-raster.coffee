exports.transform = (pSVG, pCallback, pRasterType='png') ->
  # create an (undisplayed) image
  lImg = document.createElement 'img'

  lImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent pSVG

  lImg.addEventListener 'load', (pEvent) ->
    # create an (undisplayed) canvas
    lCanvas = document.createElement 'canvas'
    lImg    = pEvent.target

    # resize the canvas to the size of the image
    lCanvas.width  = lImg.width
    lCanvas.height = lImg.height

    # ... and draw the image on there
    lCanvas.getContext('2d').drawImage lImg, 0, 0

    # smurf the data url of the canvas
    lDataURL = lCanvas.toDataURL pRasterType, 0.8

    # extract the base64 encoded image, decode and return it
    pCallback(Buffer.from(lDataURL.replace('data:image/png;base64,', ''), 'base64'))
