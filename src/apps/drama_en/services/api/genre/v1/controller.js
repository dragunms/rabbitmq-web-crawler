import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {DRAMA_EN_GENRE_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID, rulesSlug} from 'src/constants/validate';

import genreRepository from 'src/apps/drama_en/repositories/genre/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';

export default {
    /*
     * Common Role
     */

    all: {
        path: '/genres/all',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const data = await genreRepository.find();
                return res.success(data, guardCommonResponse);
            },
        ],
    },
    detail: {
        path: '/genres/detail/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const item = await genreRepository.findOneBySlug(req.params.slug);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardCommonResponse);
            },
        ],
    },

    /*
     *  Admin Role
     */

    paginate: {
        path: '/genres',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await genreRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_genres',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await genreRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/genres/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await genreRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_genres/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await genreRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/genres',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await genreRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/genres/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await genreRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await genreRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/genres/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await genreRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await genreRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_genres/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([DRAMA_EN_GENRE_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await genreRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await genreRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
