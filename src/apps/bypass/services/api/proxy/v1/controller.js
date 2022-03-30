import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {PROXY_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID} from 'src/constants/validate';

import proxyRepository from 'src/apps/bypass/repositories/proxy/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardResponse} from './response';
import {AVAILABLE_STATUS} from 'src/constants/status';
import {getIPByProxy} from 'src/apps/bypass/utils';

export default {
    /*
     *  Admin Role
     */
    checkProxy: {
        path: '/proxies/check_proxy/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([PROXY_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await proxyRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const ip = await getIPByProxy(item);

                return res.success(ip);
            },
        ],
    },

    paginate: {
        path: '/proxies',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([PROXY_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await proxyRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_proxies',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([PROXY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await proxyRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/proxies/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([PROXY_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await proxyRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_proxies/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([PROXY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await proxyRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/proxies',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([PROXY_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await proxyRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/proxies/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([PROXY_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await proxyRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await proxyRepository.modifyByUser(req.user.id, item, {
                    status: AVAILABLE_STATUS.AVAILABLE,
                    ...req.body,
                });

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/proxies/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([PROXY_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await proxyRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await proxyRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
    restore: {
        path: '/trash_proxies/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([PROXY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await proxyRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await proxyRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
