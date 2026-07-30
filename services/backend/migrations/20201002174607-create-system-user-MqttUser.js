const crypto = require('crypto');

function generatePass(pass) {
    return crypto.createHash('sha256').update(pass).digest('hex');
}

module.exports = {
    up : (queryInterface) => {
        const {
            MQTT_ROOT_USERNAME,
            MQTT_ROOT_PASSWORD
        } = process.env;

        if (!MQTT_ROOT_USERNAME) throw new Error('MQTT_ROOT_USERNAME is required!');
        if (!MQTT_ROOT_PASSWORD) throw new Error('MQTT_ROOT_PASSWORD is required!');

        const ROOT_PASS_HASH  = generatePass(MQTT_ROOT_PASSWORD);

        return queryInterface.sequelize.query(`INSERT INTO \`mqtt_user\` (\`id\`, \`username\`, \`password\`) VALUES (1,'${MQTT_ROOT_USERNAME}','${ROOT_PASS_HASH}');`);
    },

    down : (queryInterface) => {
        return queryInterface.sequelize.query('DELETE FROM `mqtt_user` WHERE `id`=1;');
    }
};
