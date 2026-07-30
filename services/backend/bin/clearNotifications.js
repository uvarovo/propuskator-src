require('@babel/register');

require('../lib/sequelize');
const Notification = require('../lib/models/Notification');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


rl.question(`Clear notifications? [y/n]`, async (input) => {
    if (input.toLowerCase() === 'y') {
        try {
            await Notification.truncate();
        } catch (e) {
            console.error(e);
        }
    }

    rl.close();
});

rl.on('close', () => {
    process.exit(0);
});
