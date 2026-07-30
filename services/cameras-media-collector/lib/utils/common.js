const crypto = require('crypto');

const SENSITIVE_DATA_STUB = '**SENSITIVE_DATA**';
const RTSP_URL_REGEX      = /"?'?rtsp:\/\/\S*/gi;

function createSha256Hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function hideSensitiveData(data) {
    if (typeof data === 'string') {
        return data.replace(RTSP_URL_REGEX, SENSITIVE_DATA_STUB);
    }

    return data;
}

module.exports = {
    createSha256Hash,
    hideSensitiveData
};
