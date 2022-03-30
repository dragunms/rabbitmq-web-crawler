import {NOT_EXISTS} from '@azteam/error';
import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';

import {DRAMA_EN_MOVIE_ROLE, SYSTEM_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID, rulesSlug} from 'src/constants/validate';

import movieRepository from 'src/apps/drama_en/repositories/movie/repository';
import syncMovieRepository from 'src/apps/drama_en/repositories/syncMovie/repository';

import {filterOptions, paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';
import {messageQueueProvider, PROVIDER} from 'src/providers';
import {MQ_CRAWL_ALL_MOVIE} from 'src/apps/drama_en/constants/service';

export default {
    /*
     * Common Role
     */

    listByChar: {
        path: '/movies/char/:char',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const data = await movieRepository.find({
                    letter: req.params.char,
                });
                return res.success(data, guardCommonResponse);
            },
        ],
    },

    filter: {
        path: '/movies/filter',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                if (req.query.genre) {
                    req.query.genres = {$elemMatch: {slug: req.query.genre}};
                    delete req.query.genre;
                }
                if (req.query.country) {
                    req.query['country.slug'] = req.query.country;
                    delete req.query.country;
                }
                const paginateData = await movieRepository.find(req.query, req.paginate);
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },
    detail: {
        path: '/movies/detail/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const item = await movieRepository.findOneBySlug(req.params.slug);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardCommonResponse);
            },
        ],
    },

    /*
     *  Admin Role
     */

    pingCrawlerAll: {
        path: '/movies/ping/crawler_all',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.SYSTEM),
            async function (req, res) {
                const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
                await messageQueue.send(MQ_CRAWL_ALL_MOVIE);
                return res.success(true);
            },
        ],
    },

    compare: {
        path: '/movies/compare/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await movieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const itemSync = await syncMovieRepository.findOneBySlug(item.slug);

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
        path: '/movies',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await movieRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_movies',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await movieRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/movies/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await movieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_movies/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await movieRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/movies',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await movieRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/movies/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await movieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await movieRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/movies/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await movieRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await movieRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_movies/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([DRAMA_EN_MOVIE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await movieRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await movieRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
