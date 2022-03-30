import config from 'config';
import TelegramAPI from '@azteam/telegram-api';
import {UNKNOWN, VALIDATE} from '@azteam/error';

const telegram = new TelegramAPI(config.get('TELEGRAM.TOKEN'));

export async function sendErrorApiMessage(error) {
    try {
        if (typeof error === 'object' && error.errors && error.errors[0]) {
            if (error.errors[0].code === VALIDATE || error.errors[0].code === UNKNOWN) {
                await telegram.sendInboxMessage(config.get('TELEGRAM.ERROR_CHANNEL'), JSON.stringify(error));
            }
        }
    } catch (e) {
        console.error(e);
    }
}

export async function sendErrorMessage(name, error) {
    try {
        await telegram.sendInboxMessage(config.get('TELEGRAM.ERROR_CHANNEL'), `<strong>${name}</strong><pre>\n</pre>${error.toString()}`);
    } catch (e) {
        console.error(e);
    }
}

export async function sendDebugMessage(msg) {
    try {
        if (typeof msg === 'object') {
            // eslint-disable-next-line no-param-reassign
            msg = JSON.stringify(msg);
        }
        // TODO silent
        // await telegram.sendInboxMessage(config.get('TELEGRAM.DEBUG_CHANNEL'), msg);
    } catch (e) {
        console.error(e);
    }
}
