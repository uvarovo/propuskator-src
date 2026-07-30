const YARGS = require('yargs');
require('@babel/register');
const sequelize = require('../lib/sequelize');
const AdminUser = require('../lib/models/AdminUser');
const AdminUsersRegister = require('../lib/services/admin/adminUsers/Register');

yargs = YARGS
    .command('help', 'Show help', function (){
        return yargs.showHelp();
    })
    .option('login', {
        description: 'Host or ip address',
        type: 'string',
        default : 'admin',
        demandOption: true
    })
    .option('password', {
        description: 'Password',
        type: 'string',
        default : '2SmartAccess',
        demandOption: true
    })
    .option('workspace', {
        description: 'Workspace',
        type: 'string',
        default : 'admin',
        demandOption: true
    })
    .help('help')
    .alias('help', 'h')
    .scriptName("npm run").fail(function (msg, err, yargs) {
        if (err) console.error(err);
        else console.error('You should be doing', yargs.help());
        if (msg) {
            console.error('Error occured:')
            console.error(msg)
        }
        process.exit(0)
      })
    .argv;

async function main({ login, password, workspace }) {
    await sequelize.transaction(async () => {
        const adminUser = await AdminUser.findOne({ where: { login } });
        if (adminUser) {
            console.log(`Admin \`${login}\` exists. Updating password`);
            await adminUser.update({ login, password });
        } else {
            console.log(`Creating admin \`${login}\` and workspace \`${workspace}\``);
            await (new AdminUsersRegister({ context: {} })).execute({ login, password, workspace });
        }
    })
}
main(yargs).then(async () => {
    await sequelize.close();
    process.exit(0);
}, async e => {
    console.log(e);
    process.exit(1);
})