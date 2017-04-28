exports.transform = (pSVG, pCallback, pRasterType = 'image/png') => {

    let lImg = document.createElement('img');

    lImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pSVG)}`;

    lImg.addEventListener('load', function (pEvent) {

        // create an (undisplayed) canvas
        let lCanvas = document.createElement('canvas');
        let lImage  = pEvent.target;

        // resize the canvas to the size of the image
        lCanvas.width  = lImage.width;
        lCanvas.height = lImage.height;

        // ... and draw the image on there
        lCanvas.getContext('2d').drawImage(lImage, 0, 0);

        // smurf the data url of the canvas
        let lDataURL = lCanvas.toDataURL(pRasterType, 0.8);

        // extract the base64 encoded image, decode and return it
        pCallback(
            Buffer.from(
                lDataURL.replace(`data:${pRasterType};base64,`, ''),
                'base64'
            )
        );
    });
};
