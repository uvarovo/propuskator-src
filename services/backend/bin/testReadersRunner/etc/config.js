module.exports = { 
    READERS_QUANTITY : process.env.READERS_QUANTITY || 5, 
    SERVER_URL : process.env.BACKEND_HOSTNAME || 'localhost:8000',
    MQTT_URL   : process.env.MQTT_URL || 'access-emqx:1883',
    MQTT_PASS  : process.env.MQTT_ROOT_PASSWORD || '1234567890',
    MQTT_USERNAME : process.env.MQTT_ROOT_USERNAME || 'microcloud'
};
