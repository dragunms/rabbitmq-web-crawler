import config from 'config';
import {ApiServer} from '@azteam/express';

import {sendErrorApiMessage} from 'src/modules/message';

new ApiServer(__dirname)
    .setCookieOptions(config.get('COOKIE_OPTIONS'))
    .setCallbackError(function (error) {
        sendErrorApiMessage(error);
    })
    .startPort(config.get('PORT.ASSET'));
