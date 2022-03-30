import {NOT_EXISTS} from '@azteam/error';
import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';

import {ANIME_ES_EPISODE_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID, rulesSlug} from 'src/constants/validate';

import episodeRepository from 'src/apps/anime_es/repositories/episode/repository';
import syncAnimeRepository from 'src/apps/anime_es/repositories/syncAnime/repository';

import {filterOptions, paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';

export default {
    /*
     * Common Role
     */

    filter: {
        path: '/episodes/filter',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                if (req.query.status !== undefined) {
                    req.query['anime.anime_status'] = req.query.status;
                    delete req.query.status;
                }
                if (req.query.country !== undefined) {
                    req.query['anime.country'] = req.query.country;
                    delete req.query.status;
                }
                const paginateData = await episodeRepository.find(req.query, req.paginate);
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },
    detail: {
        path: '/episodes/detail/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const item = await episodeRepository.findOneBySlug(req.params.slug);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardCommonResponse);
            },
        ],
    },

    listByMovie: {
        path: '/episodes/animes/:id',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const data = await episodeRepository.find({
                    'anime._id': req.params.id,
                });
                return res.success(data, guardCommonResponse);
            },
        ],
    },

    /*
     *  Admin Role
     */

    compare: {
        path: '/episodes/compare/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await episodeRepository.findOneById(req.params.id);
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
        path: '/episodes',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await episodeRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_episodes',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await episodeRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/episodes/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await episodeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_episodes/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await episodeRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/episodes',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await episodeRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/episodes/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await episodeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await episodeRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/episodes/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await episodeRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await episodeRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_episodes/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_EPISODE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await episodeRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await episodeRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
