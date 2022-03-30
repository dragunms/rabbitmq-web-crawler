import config from 'config';
import {ApiServer, authMiddleware} from '@azteam/express';
import {sendErrorApiMessage} from 'src/modules/message';

import HttpREST from 'src/modules/httpREST';

new ApiServer(__dirname)
    .setCookieOptions(config.get('COOKIE_OPTIONS'))
    .setWhiteList(config.get('CORS_WHITE_LIST'))
    .setCallbackError(function (error) {
        sendErrorApiMessage(error);
    })
    .addGlobalMiddleware(authMiddleware(HttpREST.refreshToken, HttpREST.apiAuth))
    .startPort(config.get('PORT.BYPASS'));
