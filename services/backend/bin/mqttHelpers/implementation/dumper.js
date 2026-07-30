/* eslint-disable import/no-commonjs */

const fs         = require('fs');
const { docopt } = require('docopt');
const mqtt       = require('mqtt');

const {
    MQTT_BROKER_URI,
    MQTT_ROOT_USERNAME,
    MQTT_ROOT_PASSWORD
} = process.env;

async function main({ helpMessage, dumpTimeout }) {
    try {
        const args = docopt(helpMessage);

        const {
            '<url>'             : url,
            '<name>'            : username,
            '<pass>'            : password,
            '<topics_filepath>' : topicsFile
        } = args;

        console.log(''.padEnd(100, '='));
        console.log({ url, username, password });
        console.log(''.padEnd(100, '='));

        const mqttClient = createMqttClient({ url, username, password });

        await dump({ mqttClient, topicsFile, dumpTimeout });

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

async function dump({ mqttClient, topicsFile, dumpTimeout }) {
    const stateMap = {};

    const topicsToSubscribe = topicsFile
        ? require(topicsFile)
        : [ '#' ];

    console.log('Subscribe to topics:');
    console.log(topicsToSubscribe);

    return new Promise((resolve, reject) => {
        mqttClient.on('connect', () => {
            console.log('CONNECTED');
            mqttClient.subscribe(topicsToSubscribe, (err) => {
                if (err) {
                    console.log('error = ', err);
                } else {
                    console.log('SUBSCRIBED');

                    setTimeout(() => {
                        fs.writeFile('./data.json', JSON.stringify(stateMap, null, 2), (e) => {
                            if (e) return reject(e);
                            mqttClient.end();

                            return resolve(stateMap);
                        });
                    }, dumpTimeout);
                }
            });
        });
        let messagesCount = 0;

        mqttClient.on('message', (topic, message) => {
            const msg = message.toString();

            stateMap[topic] = msg;

            messagesCount += 1;
            if (!(messagesCount % 1000)) console.log(`Messages synced: ${messagesCount}`);
        });

        mqttClient.on('error', (error) => {
            console.log(error);

            return reject(error);
        });
    });
}

module.exports = { main };
