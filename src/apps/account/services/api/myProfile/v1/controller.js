import {HTTP_METHOD, limitRequestMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {PASSWORD_FAILED, USER_BLOCKED, USER_NOT_FOUND} from '@azteam/error';

import {ACCOUNT_STATUS} from 'src/constants/status';

import userRepository from 'src/apps/account/repositories/user/repository';
import userLogRepository from 'src/apps/account/repositories/userLog/repository';

import {rulesChangePassword, rulesChangeProfile, rulesCheckPassword, rulesCreatePassword} from './request';
import {allowResponse, guardResponse} from './response';

export default {
    /*
     *  Profile Role
     */

    getLogs: {
        path: '/profile/logs',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware(),
            async function (req, res) {
                const userLogs = await userLogRepository.find({
                    created_id: req.user.id,
                });
                return res.success(userLogs);
            },
        ],
    },

    profile: {
        path: '/profile',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware(),
            async function (req, res) {
                const user = await userRepository.findOneById(req.user.id);
                if (!user) return res.error(USER_NOT_FOUND);
                if (user.status === ACCOUNT_STATUS.BLOCKED) return res.error(USER_BLOCKED);
                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },

    changeProfile: {
        path: '/profile',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware(),
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesChangeProfile),
            async function (req, res) {
                let user = await userRepository.findOneById(req.user.id);
                if (!user) return res.error(USER_NOT_FOUND);

                user = await userRepository.modify(user, req.body);

                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },

    changePassword: {
        path: '/profile/password',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware(),
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesChangePassword),
            async function (req, res) {
                const user = await userRepository.findOneById(req.user.id);
                if (!user) return res.error(USER_NOT_FOUND);
                if (user.password && !user.comparePassword(req.body.password, user.password)) return res.error(PASSWORD_FAILED);

                user.password = req.body.new_password;
                user.hashPassword();
                await user.save();

                await userLogRepository.clearLogsByUser(user.id);

                return res.success(true);
            },
        ],
    },

    checkPassword: {
        path: '/profile/check_password',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware(),
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCheckPassword),
            async function (req, res) {
                const user = await userRepository.findOneById(req.user.id);
                if (!user) return res.error(USER_NOT_FOUND);
                if (user.password && !user.comparePassword(req.body.password, user.password)) return res.error(PASSWORD_FAILED);

                return res.success(true);
            },
        ],
    },

    createPassword: {
        path: '/profile/create_password',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware(),
            limitRequestMiddleware(10),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreatePassword),
            async function (req, res) {
                const user = await userRepository.findOneById(req.user.id);
                if (!user) return res.error(USER_NOT_FOUND);
                if (user.password) return res.error(PASSWORD_FAILED);

                user.password = req.body.new_password;
                user.hashPassword();
                await user.save();

                await userLogRepository.clearLogsByUser(user.id);

                return res.success(true);
            },
        ],
    },
};
