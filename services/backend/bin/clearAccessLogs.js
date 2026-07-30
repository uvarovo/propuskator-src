require('@babel/register');

require('../lib/sequelize');
const AccessLog = require('../lib/models/AccessLog');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


rl.question(`Clear access logs? [y/n]`, async (input) => {
    if (input.toLowerCase() === 'y') {
        try {
            await AccessLog.truncate();
        } catch (e) {
            console.error(e);
        }
    }

    rl.close();
});

rl.on('close', () => {
    process.exit(0);
});
