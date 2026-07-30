import { mqttConnectionOptions } from '../config';
import { initLogger } from '../extensions/Logger';
import MQTTTransport from './MQTTTransport';

const mqttTransport = new MQTTTransport({
    ...mqttConnectionOptions,
    debug : initLogger('MQTTTransport')
});

export default mqttTransport;
