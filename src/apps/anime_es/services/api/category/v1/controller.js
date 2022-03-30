import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {ANIME_ES_CATEGORY_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID} from 'src/constants/validate';

import categoryRepository from 'src/apps/anime_es/repositories/category/repository';

import {filterOptions, paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';

export default {
    /*
     * Common Role
     */

    all: {
        path: '/categories/all',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const data = await categoryRepository.find();
                return res.success(data, guardCommonResponse);
            },
        ],
    },

    filter: {
        path: '/categories/filter',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                const paginateData = await categoryRepository.find(req.query, req.paginate);
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },
    /*
     *  Admin Role
     */

    paginate: {
        path: '/categories',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await categoryRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_categories',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await categoryRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/categories/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await categoryRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_categories/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await categoryRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/categories',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await categoryRepository.createByUser(req.user.id, req.body);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/categories/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await categoryRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await categoryRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/categories/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await categoryRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await categoryRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_categories/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_CATEGORY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await categoryRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await categoryRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
