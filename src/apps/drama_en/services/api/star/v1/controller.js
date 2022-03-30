import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {DRAMA_EN_STAR_ROLE, SYSTEM_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID, rulesSlug} from 'src/constants/validate';

import {messageQueueProvider, PROVIDER} from 'src/providers';

import starRepository from 'src/apps/drama_en/repositories/star/repository';
import syncStarRepository from 'src/apps/drama_en/repositories/syncStar/repository';
import {MQ_CRAWL_ALL_STAR} from 'src/apps/drama_en/constants/service';

import {filterOptions, paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';

export default {
    /*
     * Common Role
     */

    filter: {
        path: '/stars/filter',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                const paginateData = await starRepository.find(req.query, req.paginate);
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },
    detail: {
        path: '/stars/detail/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const item = await starRepository.findOneBySlug(req.params.slug);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardCommonResponse);
            },
        ],
    },

    /*
     *  Admin Role
     */

    pingCrawlerAll: {
        path: '/stars/ping/crawler_all',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.SYSTEM),
            async function (req, res) {
                const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
                await messageQueue.send(MQ_CRAWL_ALL_STAR);
                return res.success(true);
            },
        ],
    },

    compare: {
        path: '/stars/compare/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await starRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const itemSync = await syncStarRepository.findOneBySlug(item.slug);

                return res.success(
                    {
                        root: item,
                        sync: itemSync,
                    },
                    guardResponse,
                    allowResponse
                );
            },
        ],
    },

    paginate: {
        path: '/stars',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await starRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_stars',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await starRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/stars/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await starRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_stars/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await starRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/stars',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await starRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/stars/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await starRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await starRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/stars/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await starRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await starRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_stars/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([DRAMA_EN_STAR_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await starRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await starRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
