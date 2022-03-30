import config from 'config';
import nodemailer from 'nodemailer';

import {renderTemplateFile} from 'src/util';

const GMAIL_CONFIG = config.get('EMAIL.GMAIL');
const gmailSender = nodemailer.createTransport(GMAIL_CONFIG);

export async function sendEmailByGmail(options, params, callback) {
    return gmailSender.sendMail(
        {
            ...options,
            from: `"${process.env.SITE_NAME} Service" <${GMAIL_CONFIG.auth.user}>`,
            text: await renderTemplateFile(`email/${options.template}/text.ejs`, params),
            html: await renderTemplateFile(`email/${options.template}/html.ejs`, params),
        },
        callback
    );
}
