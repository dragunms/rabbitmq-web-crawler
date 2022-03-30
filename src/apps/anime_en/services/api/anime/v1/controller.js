import {NOT_EXISTS} from '@azteam/error';
import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';

import {ANIME_EN_ANIME_ROLE, SYSTEM_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID, rulesSlug} from 'src/constants/validate';
import {
    MQ_CRAWL_ANIME_EN_ALL_ANIME,
    MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE,
    MQ_CRAWL_ANIME_EN_POPULAR_ANIME,
    MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE,
    MQ_SYNC_ANIME_EN_ALL_ANIME,
} from 'src/apps/anime_en/constants/service';

import animeRepository from 'src/apps/anime_en/repositories/anime/repository';
import syncAnimeRepository from 'src/apps/anime_en/repositories/syncAnime/repository';

import {filterOptions, paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';
import {messageQueueProvider, PROVIDER} from 'src/providers';

export default {
    /*
     * Common Role
     */

    listByChar: {
        path: '/animes/char/:char',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                if (req.params.char === '0') {
                    const data = await animeRepository.find();
                    return res.success(data, guardCommonResponse);
                }
                const paginateData = await animeRepository.find(
                    {
                        letter: req.params.char,
                    },
                    req.paginate
                );
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },

    filter: {
        path: '/animes/filter',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                if (req.query.genre) {
                    req.query.genres = {$elemMatch: {slug: req.query.genre}};
                    delete req.query.genre;
                }
                if (req.query.sub_category) {
                    req.query['sub_category.slug'] = req.query.sub_category;
                    delete req.query.sub_category;
                }
                const paginateData = await animeRepository.find(req.query, req.paginate);
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },
    detail: {
        path: '/animes/detail/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const item = await animeRepository.findOneBySlug(req.params.slug);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardCommonResponse);
            },
        ],
    },

    /*
     *  Admin Role
     */

    pingCrawlerAll: {
        path: '/animes/ping/crawler_all',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.SYSTEM),
            async function (req, res) {
                const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
                await messageQueue.send(MQ_CRAWL_ANIME_EN_ALL_ANIME);
                return res.success(true);
            },
        ],
    },

    pingCrawlerChinese: {
        path: '/animes/ping/crawler_chinese',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.SYSTEM),
            async function (req, res) {
                const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
                await messageQueue.send(MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE);
                return res.success(true);
            },
        ],
    },

    pingCrawlerPopular: {
        path: '/animes/ping/crawler_popular',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.SYSTEM),
            async function (req, res) {
                const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
                await messageQueue.send(MQ_CRAWL_ANIME_EN_POPULAR_ANIME);
                return res.success(true);
            },
        ],
    },

    pingCrawlerRecent: {
        path: '/animes/ping/crawler_recent',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.SYSTEM),
            async function (req, res) {
                const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
                await messageQueue.send(MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE);
                return res.success(true);
            },
        ],
    },

    compare: {
        path: '/animes/compare/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await animeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const itemSync = await syncAnimeRepository.findOneBySlug(item.slug);

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
        path: '/animes',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await animeRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_animes',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await animeRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/animes/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await animeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_animes/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await animeRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/animes',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await animeRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/animes/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await animeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await animeRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/animes/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await animeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await animeRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_animes/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_EN_ANIME_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await animeRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await animeRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
