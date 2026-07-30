/* eslint-disable import/no-commonjs,no-template-curly-in-string */
/* eslint-disable import/no-extraneous-dependencies */
require('@babel/register');
const sequelize          = require('../lib/sequelize');
const AccessTokenReader  = require('../lib/models/AccessTokenReader');

async function main() {
    await AccessTokenReader.update({
        resetRules : true
    });
}
// eslint-disable-next-line more/no-then
main().then(async () => {
    console.log('OK');
    await sequelize.close();
    process.exit(0);
}, async e => {
    console.log(e);
    process.exit(1);
});
