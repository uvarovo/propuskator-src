/* eslint-disable import/no-commonjs,no-template-curly-in-string */
/* eslint-disable import/no-extraneous-dependencies */
require('@babel/register');
const sequelize         = require('../lib/sequelize');
const AccessTokenReader = require('../lib/models/AccessTokenReader');

const getNumberByIndex = (numbers, index) => numbers?.[index] ? numbers?.[index] : numbers?.[index % numbers?.length] 

async function main() {
    const newNumbers = process.env.READER_PHONE_NUMBERS.split(',');
    const currentNumbers = (await AccessTokenReader.findAll({ where: { phone: { [sequelize.Op.ne]: null } }, attributes: [ 'phone' ], group: 'phone', raw: true })).map(({ phone }) => phone);

    if (!newNumbers?.length) return console.log('READER_PHONE_NUMBERS env is empty');
    if (!currentNumbers?.length) return console.log('AccessTokenReader contains no phones')

    for (let index = 0; index < Math.max(newNumbers?.length, currentNumbers?.length); index++) {
        await AccessTokenReader.update(
            { phone: getNumberByIndex(newNumbers, index) },
            { where: { phone: getNumberByIndex(currentNumbers, index) } }
        );
    }

    console.log('Replacing completed...');
    process.exit(0);
}

main().then(async () => {
    await sequelize.close();
    process.exit(0);
}, async e => {
    console.log('Replacing failed.');
    console.log(e);
    process.exit(1);
});
