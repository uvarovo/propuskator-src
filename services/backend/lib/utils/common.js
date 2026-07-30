import fs   from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

import { MILLISECONDS_IN_SECOND, SECONDS_IN_MINUTE } from '../constants/common';

const SALT_ROUNDS = 2;

// TODO: make universal function to converting milliseconds
function millisecondsToMinutes(ms) {
    return ms / MILLISECONDS_IN_SECOND / SECONDS_IN_MINUTE;
}

// Returns the string  representing current system timezone offset.
// Format: '<sign>HH:MM'
//     <sign> - '+' or '-'
// Example for the timezone 'Europe/Kiev': '+02:00'
function getFormattedCurrentTimezoneOffset() {
    const timezoneHoursOffsetWithSign = -(new Date().getTimezoneOffset() / 60);
    const timezoneHoursOffsetAbs = Math.abs(timezoneHoursOffsetWithSign);

    let timezone = `${Math.floor(Math.abs(timezoneHoursOffsetAbs))}`;

    timezone = `${'0'.repeat(2 - timezone.length)}${timezone}`;

    timezone = `${Math.sign(timezoneHoursOffsetWithSign) >= 0 ? '+' : '-'}${timezone}` +
        ':' +
        `${timezoneHoursOffsetAbs - Math.floor(timezoneHoursOffsetAbs) === 0.5 ? '30' : '00'}`;

    return timezone;
}

function hashPassword(password) {
    const salt = bcrypt.genSaltSync(SALT_ROUNDS); // eslint-disable-line no-sync

    return bcrypt.hashSync(password, salt); // eslint-disable-line no-sync
}

async function readFilesStatsFromDir(dirPath) {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const dirent of dirents) {
        if (dirent.isFile()) {
            const filePath = path.join(dirPath, dirent.name);
            const stats = await fs.stat(filePath);
            const file = { path: filePath, stats };

            files.push(file);
        }
    }

    return files;
}

// Waits for a provided amount of time
// time {number} - a time to wait, in milliseconds
async function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export {
    millisecondsToMinutes,
    getFormattedCurrentTimezoneOffset,
    hashPassword,
    readFilesStatsFromDir,
    sleep
};
