import childProcess from 'child_process';
import util         from 'util';

const exec = util.promisify(childProcess.exec);

// Execute 'ffprobe' utility in loop until a media file will become valid. If the media file
// is not valid, 'ffprobe' will exit with non-zero exit code.
// Example of usage: when some process is still writing to a file and we need to wait until the end
// of writing to use a valid file
async function waitForMediaFileIntegrity(path, { timeout = 60000 } = {}) {
    await exec(
        `while ! ffprobe -loglevel quiet ${path}; ` +
        'do sleep 1; ' +
        'done;',
        {
            timeout
        }
    );
}

export {
    waitForMediaFileIntegrity
};
