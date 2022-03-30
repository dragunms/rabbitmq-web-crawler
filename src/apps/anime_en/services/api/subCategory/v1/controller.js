import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {ANIME_EN_SUB_CATEGORY_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID} from 'src/constants/validate';

import subCategoryRepository from 'src/apps/anime_en/repositories/subCategory/repository';

import {filterOptions, paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardCommonResponse, guardResponse} from './response';

export default {
    /*
     * Common Role
     */

    all: {
        path: '/sub_categories/all',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const data = await subCategoryRepository.find();
                return res.success(data, guardCommonResponse);
            },
        ],
    },

    filter: {
        path: '/sub_categories/filter',
        type: HTTP_METHOD.GET,
        method: [
            paginateMiddleware(filterOptions),
            async function (req, res) {
                const paginateData = await subCategoryRepository.find(req.query, req.paginate);
                return res.success(paginateData, guardCommonResponse);
            },
        ],
    },
    /*
     *  Admin Role
     */

    paginate: {
        path: '/sub_categories',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await subCategoryRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_sub_categories',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await subCategoryRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/sub_categories/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await subCategoryRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_sub_categories/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await subCategoryRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/sub_categories',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await subCategoryRepository.createByUser(req.user.id, req.body);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/sub_categories/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await subCategoryRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await subCategoryRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/sub_categories/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await subCategoryRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await subCategoryRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_sub_categories/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_EN_SUB_CATEGORY_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await subCategoryRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await subCategoryRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
