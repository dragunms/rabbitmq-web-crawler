import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {COOKIE_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {AVAILABLE_STATUS} from 'src/constants/status';
import {rulesID} from 'src/constants/validate';

import cookieRepository from 'src/apps/bypass/repositories/cookie/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardResponse} from './response';
import {retryWithCookie, retryWithPuppeteer} from 'src/apps/bypass/utils';

export default {
    /*
     *  Admin Role
     */
    checkCookie: {
        path: '/cookies/check_cookie/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([COOKIE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await cookieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const html = await retryWithCookie(`${item.protocol}://${item.domain}`, item);

                return res.success(html);
            },
        ],
    },

    checkPuppeteer: {
        path: '/cookies/check_puppeteer/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([COOKIE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await cookieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const html = await retryWithPuppeteer(`${item.protocol}://${item.domain}`, item);

                return res.success(html);
            },
        ],
    },

    paginate: {
        path: '/cookies',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([COOKIE_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await cookieRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_cookies',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([COOKIE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await cookieRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/cookies/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([COOKIE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await cookieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_cookies/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([COOKIE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await cookieRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/cookies',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([COOKIE_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await cookieRepository.createByUser(req.user.id, req.body);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/cookies/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([COOKIE_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await cookieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await cookieRepository.modifyByUser(req.user.id, item, {
                    count: 0,
                    version: item.version + 1,
                    status: AVAILABLE_STATUS.AVAILABLE,
                    ...req.body,
                });
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/cookies/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([COOKIE_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await cookieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await cookieRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
    restore: {
        path: '/trash_cookies/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([COOKIE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await cookieRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await cookieRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
