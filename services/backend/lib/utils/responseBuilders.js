import fse from 'fs-extra';
import { initLogger } from '../extensions/Logger';

const logger = initLogger('Response builders');

function sendAndDeleteFile(req, res, next, filePath) {
    res.on('close', async () => {
        try {
            await fse.remove(filePath);
        } catch (e) {
            logger.warn(`sendAndDeleteFile ${JSON.stringify({
                error : e.message,
                filePath
            })}`);
        }
    });
    res.sendFile(filePath);
}

export {
    sendAndDeleteFile
};
