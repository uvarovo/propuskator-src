#!/usr/bin/env node

/* eslint-disable import/no-commonjs */

const { main } = require('./implementation/dumper');

const HELP_MESSAGE = `Usage:
   ./dumper.js [-d | --delete] [-t | --topics <topics_filepath>]
   ./dumper.js [-u | --url <url>] [-n | --name <name>] [-p | --pass <pass>] [-t | --topics <topics_filepath>]
   ./dumper.js -h | --help

Options:
   --help         Show this screen.
   -u --url       MQTT url.
   -n --name      MQTT username.
   -p --pass      MQTT password.
   -t --topics    File with array of topics to subscribe.
`;
const DUMP_TIMEOUT = +process.env.DUMP_TIMEOUT || 15000;

main({ helpMessage: HELP_MESSAGE, dumpTimeout: DUMP_TIMEOUT }).catch(err => {
    console.error(err);

    process.exit(1);
});
