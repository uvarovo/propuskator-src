function hideSensitiveData(sensitiveData) {
    const SENSITIVE_DATA = '**SENSITIVE DATA**';

    if (typeof sensitiveData === 'object') {
        const sanitizedObject = {};

        for (const key of Object.keys(sensitiveData)) {
            /* using an exact comparison because the word "token" reflects
            other entities that are not sensitive data */
            if (key.match(/pass|rtspUrl/gi) || key === 'token') {
                sanitizedObject[key] = SENSITIVE_DATA;
            } else if (key === 'data') {
                sanitizedObject[key] = hideSensitiveData(sensitiveData[key]);
            } else sanitizedObject[key] = sensitiveData[key];
        }

        return sanitizedObject;
    }

    if (typeof sensitiveData === 'string') {
        const rtspUrlRegex = /"?'?rtsp:\/\/\S*/gi;

        return sensitiveData.replace(rtspUrlRegex, SENSITIVE_DATA);
    }

    return sensitiveData;
}

export {
    hideSensitiveData
};
