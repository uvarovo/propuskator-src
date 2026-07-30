/* eslint-disable import/no-commonjs */

const { docopt } = require('docopt');
const mqtt       = require('mqtt');

const {
    MQTT_BROKER_URI,
    MQTT_ROOT_USERNAME,
    MQTT_ROOT_PASSWORD
} = process.env;

async function main({ helpMessage }) {
    try {
        const args = docopt(helpMessage);

        const {
            '--delete'   : isDelete,
            '<url>'      : url,
            '<name>'     : username,
            '<pass>'     : password,
            '<filepath>' : filePath
        } = args;

        const mqttClient = createMqttClient({ url, username, password });

        await setValues({ mqttClient, filePath, isDelete });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

function createMqttClient({ url, username, password }) {
    return mqtt.connect(url || MQTT_BROKER_URI, {
        username           : username || MQTT_ROOT_USERNAME,
        password           : password || MQTT_ROOT_PASSWORD,
        rejectUnauthorized : false
    });
}

async function setValues({ mqttClient, filePath, isDelete }) {
    const state = require(filePath || '../data.json');

    return new Promise((resolve, reject) => {
        mqttClient.on('connect',  async () => {
            console.log('CONNECTED');
            console.log(''.padEnd(100, '='));
            console.log('Setting values to topics in broker');
            console.log(''.padEnd(100, '='));
            console.log(`Topics to process ${Object.keys(state).length}`);

            let topicsCount = 0;

            let timerLabel = 1000;

            console.time(timerLabel);
            for (const topic in state) {
                if (!state[topic]) continue;
                const value = isDelete
                    ? ''
                    : state[topic];

                await _setTopic({ topic, value, mqttClient });

                topicsCount += 1;
                if (!(topicsCount % 1000)) {
                    console.timeEnd(timerLabel);
                    console.log(`Topics processed: ${topicsCount}`);
                    timerLabel = timerLabel + 1000;
                    console.time(timerLabel);
                }
            }

            resolve();
        });

        mqttClient.on('error', err => {
            console.error(err);

            reject();
        });
    });
}

function _setTopic({ topic, value = '', mqttClient }) {
    return new Promise((resolve, reject) => {
        // QoS with 2 level needed to ensure that the message was received by the broker
        mqttClient.publish(topic, value, { qos: 2, retain: true }, (err) => {
            if (err) {
                console.error('ERROR!: ', err, topic);
                reject();
            }

            console.log('success', topic, value);

            resolve();
        });
    });
}

module.exports = { main, createMqttClient, setValues };
