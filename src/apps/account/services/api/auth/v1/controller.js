import config from 'config';
import jwt from 'jsonwebtoken';
import {decryptAES} from '@azteam/crypto';
import {FacebookAuthClient} from '@azteam/facebook-api';
import {GoogleAuthClient} from '@azteam/google-api';
import {HTTP_METHOD, limitRequestMiddleware, REQUEST_TYPE, validateMiddleware} from '@azteam/express';
import {
    ErrorException,
    LOGIN_FAILED,
    OTP_FAILED,
    PASSWORD_EMPTY,
    PASSWORD_FAILED,
    UNAUTHORIZED,
    USER_ALREADY_EXISTS,
    USER_BLOCKED,
    USER_NOT_FOUND,
    USER_NOT_VERIFIED,
} from '@azteam/error';

import {ACCOUNT_STATUS, BOOLEAN_STATUS} from 'src/constants/status';
import {TTL_OTP, USER_LEVEL} from 'src/constants/system';

import {messageQueueProvider, PROVIDER} from 'src/providers';

import userRepository from 'src/apps/account/repositories/user/repository';
import userPositionRepository from 'src/apps/account/repositories/userPosition/repository';
import userLogRepository from 'src/apps/account/repositories/userLog/repository';

import {MQ_SEND_FORGOT_EMAIL, MQ_SEND_VERIFY_EMAIL} from 'src/apps/account/constants/service';

import {
    rulesLogin,
    rulesLoginByEmail,
    rulesLoginSocial,
    rulesRefreshToken,
    rulesRegisterByEmail,
    rulesResetPassword,
    rulesSendOTPEmail,
    rulesVerifyEmail,
    rulesVerifyEmailHash,
} from './request';
import {allowResponse, guardResponse} from './response';

const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

async function createAccessToken(user, expiredMinutes = 15) {
    const payload = {
        id: user.id,
        level: user.level,
        name: user.name,
        avatar: user.avatar,
    };

    if (user.position_id) {
        const userPosition = await userPositionRepository.findOneById(user.position_id);
        payload.position = user.position_id;
        payload.roles = userPosition.roles;
    }

    // expiredMinutes = 1;

    return jwt.sign(
        {
            ...payload,
            exp: Math.floor(Date.now() / 1000) + 60 * expiredMinutes,
        },
        process.env.SECRET_KEY
    );
}

async function verifyEmail(email, otp) {
    const user = await userRepository.findOneByEmail(email);
    if (!user) throw new ErrorException(USER_NOT_FOUND);

    if (!user.verifyOTP(otp, TTL_OTP.EMAIL)) {
        throw new ErrorException(OTP_FAILED);
    }

    if (user.is_verify_email === BOOLEAN_STATUS.FALSE) {
        await userRepository.modify(user, {
            is_verify_email: BOOLEAN_STATUS.TRUE,
            status: ACCOUNT_STATUS.ACTIVATED,
        });
    }
    return user;
}

async function loginSuccess(req, res, user) {
    const log = await userLogRepository.createByUser(user.id, req.trackDevice);

    const cookies = {
        access_token: await createAccessToken(user),
        refresh_token: log.id,
    };

    res.addCookie(cookies);
    return res.success(cookies);
}

async function loginSocialSuccess(req, res, field, profile) {
    /*
     * field: [facebook_id, google_id, apple_id]
     */

    const socialParam = {
        [field]: profile.id,
    };
    let queryParams = socialParam;

    const userData = {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        ...socialParam,
    };

    if (profile.email) {
        userData.is_verify_email = BOOLEAN_STATUS.TRUE;
        userData.status = ACCOUNT_STATUS.ACTIVATED;
        queryParams = {
            $or: [socialParam, {email: profile.email}],
        };
    }

    const user = await userRepository.findOneOrCreate(queryParams, userData, [], ['status']);

    if (!user[field]) {
        user[field] = profile.id;
        user.avatar = profile.avatar;
        await user.save();
    }

    return loginSuccess(req, res, user);
}

async function loginWithPassword(req, res, user) {
    if (!user) return res.error(USER_NOT_FOUND);
    if (!user.password) return res.error(PASSWORD_EMPTY);

    if (!user.comparePassword(req.body.password, user.password)) return res.error(PASSWORD_FAILED);

    if (user.status === ACCOUNT_STATUS.BLOCKED) return res.error(USER_BLOCKED);
    if (!user.is_verify_email && !user.is_verify_phone) return res.error(USER_NOT_VERIFIED);

    return loginSuccess(req, res, user);
}

export default {
    /*
     *  Common Role
     */
    sendOTPEmail: {
        path: '/auth/send_otp_email',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesSendOTPEmail),
            async function (req, res) {
                const user = await userRepository.findOneByEmail(req.body.email);
                if (!user) return res.error(USER_NOT_FOUND);
                if (user.is_verify_email) return res.error(USER_ALREADY_EXISTS);

                const data = {
                    email: user.email,
                };
                if (user.is_verify_email === BOOLEAN_STATUS.FALSE) {
                    messageQueue.send(MQ_SEND_VERIFY_EMAIL, data);
                }

                return res.success(data);
            },
        ],
    },
    loginByEmail: {
        path: '/auth/login_email',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesLoginByEmail),
            async function (req, res) {
                const user = await userRepository.findOneByEmail(req.body.email);
                return loginWithPassword(req, res, user);
            },
        ],
    },
    verifyEmailOTP: {
        path: '/auth/verify_email',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesVerifyEmail),
            async function (req, res) {
                const user = await verifyEmail(req.body.email, req.body.otp);
                return res.success({
                    email: user.email,
                });
            },
        ],
    },
    verifyEmailHash: {
        path: '/auth/verify_email_hash',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesVerifyEmailHash),
            async function (req, res) {
                const data = JSON.parse(decryptAES(req.body.hash, process.env.SECRET_KEY));
                const user = await verifyEmail(data.email, data.otp);
                return res.success({
                    email: user.email,
                });
            },
        ],
    },

    registerByEmail: {
        path: '/auth/register',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesRegisterByEmail),
            async function (req, res) {
                let user = await userRepository.findOneByEmail(req.body.email);
                if (user) {
                    if (user.is_verify_email === BOOLEAN_STATUS.TRUE) {
                        return res.error(USER_ALREADY_EXISTS);
                    }
                } else {
                    user = await userRepository.create({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password,
                    });
                }

                messageQueue.send(MQ_SEND_VERIFY_EMAIL, {
                    email: user.email,
                });

                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },
    sendForgotEmail: {
        path: '/auth/send_otp_forgot_email',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesSendOTPEmail),
            async function (req, res) {
                const user = await userRepository.findOneByEmail(req.body.email);
                if (!user) return res.error(USER_NOT_FOUND);

                const data = {
                    email: user.email,
                };
                messageQueue.send(MQ_SEND_FORGOT_EMAIL, data);

                return res.success(data);
            },
        ],
    },
    resetPassword: {
        path: '/auth/reset_password',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesResetPassword),
            async function (req, res) {
                const user = await verifyEmail(req.body.email, req.body.otp);

                user.password = req.body.new_password;
                user.hashPassword();
                await user.save();

                await userLogRepository.clearLogsByUser(user.id);

                return res.success(true);
            },
        ],
    },

    loginByEmailOrPhone: {
        path: '/auth/login',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesLogin),
            async function (req, res) {
                const username = req.body.username.toLowerCase();

                const user = await userRepository.findOne({
                    $or: [{email: username}, {phone_number: username}],
                });
                return loginWithPassword(req, res, user);
            },
        ],
    },

    loginAdminByEmail: {
        path: '/auth/login_admin_email',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesLoginByEmail),
            async function (req, res) {
                const user = await userRepository.findOne({
                    email: req.body.email,
                    level: USER_LEVEL.ADMIN,
                });
                return loginWithPassword(req, res, user);
            },
        ],
    },

    loginByFacebook: {
        path: '/auth/login_facebook',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesLoginSocial),
            async function (req, res) {
                const fbClient = new FacebookAuthClient(config.get('FACEBOOK_APP.APP_SECRET'), config.get('FACEBOOK_APP.APP_ID'));

                const profile = await fbClient.getProfileInApp(req.body.token);
                if (profile) {
                    return loginSocialSuccess(req, res, 'facebook_id', profile);
                }
                return res.error(LOGIN_FAILED);
            },
        ],
    },
    loginByGoogle: {
        path: '/auth/login_google',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesLoginSocial),
            async function (req, res) {
                const ggClient = new GoogleAuthClient(config.get('GOOGLE_APP.APP_SECRET'), [config.get('GOOGLE_APP.APP_ID_WEB')]);

                const profile = await ggClient.getProfileInApp(req.body.token);
                if (profile) {
                    return loginSocialSuccess(req, res, 'google_id', profile);
                }
                return res.error(LOGIN_FAILED);
            },
        ],
    },
    loginByApple: {
        path: '/auth/login_apple',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesLoginSocial),
            async function (req, res) {
                try {
                    const parseData = Buffer.from(req.body.token.split('.')[1], 'base64').toString();
                    const data = JSON.parse(parseData);

                    if (data.aud === config.get('APPLE_APP.APP_ID')) {
                        return loginSocialSuccess(req, res, 'apple_id', {
                            name: req.body.name,
                            id: data.sub,
                            email: data.email,
                        });
                    }
                } catch (e) {
                    console.error(e);
                }

                return res.error(LOGIN_FAILED);
            },
        ],
    },

    refreshToken: {
        path: '/auth/refresh_token/:token',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesRefreshToken),
            async function (req, res) {
                const userLog = await userLogRepository.findOneById(req.params.token);
                if (!userLog) return res.error(UNAUTHORIZED);
                userLog.save(); // updated time login
                const user = await userRepository.findOneById(userLog.created_id);

                const data = {
                    access_token: await createAccessToken(user),
                };
                res.addCookie(data);
                return res.success(data);
            },
        ],
    },

    logout: {
        path: '/auth/logout',
        type: HTTP_METHOD.POST,
        method: [
            async function (req, res) {
                if (req.signedCookies && req.signedCookies.refresh_token) {
                    await userLogRepository.removeToken(req.signedCookies.refresh_token);
                }
                res.cleanCookie(['access_token', 'refresh_token']);
                return res.success(true);
            },
        ],
    },
};
