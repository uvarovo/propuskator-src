#!/usr/bin/env node

/* eslint-disable import/no-commonjs */

const { main } = require('./implementation/setter');

const HELP_MESSAGE = `Usage:
   ./setter.js [-d | --delete] [-f | --file <filepath>]
   ./setter.js [-u | --url <url>] [-n | --name <name>] [-p | --pass <pass>] [-d | --delete] [-f | --file <filepath>]
   ./setter.js -h | --help

Options:
   --help         Show this screen.
   -u --url       MQTT url.
   -n --name      MQTT username.
   -p --pass      MQTT password.
   -d --delete    Delete mode.
   -f --file      File with dumped topics values.
`;

main({ helpMessage: HELP_MESSAGE }).catch(err => {
    console.error(err);

    process.exit(1);
});
