import config from 'config';
import {ApiServer, authMiddleware} from '@azteam/express';

import HttpREST from 'src/modules/httpREST';
import {sendErrorApiMessage} from 'src/modules/message';

new ApiServer(__dirname)
    .setCookieOptions(config.get('COOKIE_OPTIONS'))
    .setWhiteList(config.get('CORS_WHITE_LIST'))
    .setCallbackError(function (error) {
        sendErrorApiMessage(error);
    })
    .addGlobalMiddleware(authMiddleware(HttpREST.refreshToken, HttpREST.apiAuth))
    .startPort(config.get('PORT.ACCOUNT'));
