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
 *         workingDirectory: the working directory for dot to run in.
 *                  Default: undefined. In the atom environment undefined currently
 *                  means '/' is taken as the working directory.
 */
export default function(pDot, pCallback, pOptions) {
    const lOptions = Object.assign(
        {},
        {format: 'svg', engine: 'dot', exec: 'dot', workingDirectory: '/'},
        pOptions
    );
    const dot = spawn(
        lOptions.exec,
        [`-T${lOptions.format}`, `-K${lOptions.engine}`],
        {
            cwd: lOptions.workingDirectory
        }
    );
    let lData = '';
    let lError = null;

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
            if (lError){
                /* eslint no-console: 0 */
                /* we'll keep the console.log in one or two versions
                   (starting with 1.4.1) for debugging purposes
                 */
                console.log(lError.toString('utf-8'));
            }
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
    dot.stdin.write(pDot);
    dot.stdin.end();
}
