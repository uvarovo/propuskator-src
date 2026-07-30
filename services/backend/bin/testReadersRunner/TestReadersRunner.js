const { Worker } = require('worker_threads');
const path = require('path');
const { SERVER_URL, MQTT_URL, MQTT_PASS, MQTT_USERNAME  } = require('./etc/config');

class TestReadersRunner {
    readerFilePath = './testReader.js'

    startTestReaders({ workspaceAccessToken, accessTokenReaderCode, adminUserLogin }) {
        const workerData = {
            ADMIN_EMAIL  : adminUserLogin,
            READER_CODE  : accessTokenReaderCode,
            X_AUTH_TOKEN : workspaceAccessToken,
            MQTT_URL,
            MQTT_PASS,
            SERVER_URL,
            MQTT_USERNAME
        };

        new Worker(path.resolve(__dirname, this.readerFilePath), {
            workerData
        });

        console.log('started new test reader');
    }
}

const testReadersRunner = new TestReadersRunner();

module.exports = testReadersRunner;
