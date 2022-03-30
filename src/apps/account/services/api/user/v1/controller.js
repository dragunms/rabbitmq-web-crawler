import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {EXISTS_ITEMS, NOT_EXISTS, USER_BLOCKED, USER_NOT_FOUND} from '@azteam/error';

import {ACCOUNT_STATUS} from 'src/constants/status';
import {USER_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';

import {rulesID} from 'src/constants/validate';

import userRepository from 'src/apps/account/repositories/user/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardResponse} from './response';

export default {
    /*
     *  Common Role
     */

    preview: {
        path: '/users/preview/:id',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const user = await userRepository.findOneById(req.params.id);
                if (!user) return res.error(USER_NOT_FOUND);
                if (user.status === ACCOUNT_STATUS.BLOCKED) return res.error(USER_BLOCKED);
                return res.success(user, guardResponse);
            },
        ],
    },

    /*
     *  Admin Role
     */

    paginate: {
        path: '/users',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await userRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_users',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await userRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/users/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const user = await userRepository.findOneById(req.params.id);
                if (!user) return res.error(NOT_EXISTS);
                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/users/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const user = await userRepository.findOneTrashById(req.params.id);
                if (!user) return res.error(NOT_EXISTS);
                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/users',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([USER_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                let user = await userRepository.findOneByEmail(req.body.email);
                if (user) return res.error(EXISTS_ITEMS);

                user = await userRepository.createByUser(req.user.id, {
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    position_id: req.body.position_id,
                    level: USER_LEVEL.ADMIN,
                });

                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/users/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([USER_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let user = await userRepository.findOneById(req.params.id);
                if (!user) return res.error(NOT_EXISTS);

                const data = {};
                if (req.body.position_id) {
                    data.position_id = req.body.position_id;
                    data.level = USER_LEVEL.ADMIN;
                }

                user = await userRepository.modifyByUser(req.user.id, user, data);

                return res.success(user, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/users/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([USER_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const user = await userRepository.findOneById(req.params.id);
                if (!user) return res.error(NOT_EXISTS);

                await userRepository.deleteByUser(req.user.id, user);
                return res.success(true);
            },
        ],
    },
    restore: {
        path: '/trash_users/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([USER_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const user = await userRepository.findOneTrashById(req.params.id);
                if (!user) return res.error(NOT_EXISTS);

                await userRepository.restoreByUser(req.user.id, user);
                return res.success(true);
            },
        ],
    },
};
