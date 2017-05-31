"use babel";

import {spawn} from 'child_process';

/**
 * Takes a graphviz dot program (as a string), runs it through the dot
 * executable specified in pOptions.exec (default: 'dot') and returns
 * the result in a callback
 *
 * @param  {string} pDot        The dot program as a string
 * @param  {function} pCallback callback that takes a
 * @param  {object} pOptions
 *         format: output format - any output format supported by graphviz is
 *                  accepted. Default: 'svg'
 *         engine: the engine to use - any engine supported by graphviz is
 *                  accepted. Default: 'dot'
 *         exec: the path to the executable to run. Default: 'dot'
 */
exports.render = function(pDot, pCallback, pOptions) {
    const lOptions = Object.assign(
        {},
        pOptions,
        {format: 'svg', engine: 'dot', exec: 'dot'}
    );
    let dot = spawn(lOptions.exec, ["-T" + lOptions.format, "-K" + lOptions.engine]);
    let lData = '';
    let lError = null;

    dot.stdin.write(pDot);
    dot.stdin.end();
    dot.stdout.on('data', function(pData) {
        lData += pData;
    });
    dot.stderr.on('data', function(pError) {
        lError = pError;
    });
    dot.on('error', function(pError) {
        lError = pError;
    });
    dot.on('close', function(pCode) {
        //  0: okeleedokelee
        //  1: error in the program
        // -2: executable not found
        if (pCode === 0) {
            pCallback(null, lData);
        } else if (lError) {
            if (lError instanceof Buffer) {
                pCallback({message: lError.toString('utf8')});
            } else {
                pCallback({message: lError});
            }
        } else {
            pCallback({message: `Unexpected error occurred. Exit code ${pCode}`});
        }
    });
};
