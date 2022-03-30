import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {ANIME_ES_METADATA_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID} from 'src/constants/validate';

import metadataRepository from 'src/apps/anime_es/repositories/metadata/repository';
import genreRepository from 'src/apps/anime_es/repositories/genre/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardResponse} from './response';

export default {
    /*
     *  Common Role
     */
    findAll: {
        path: '/metadata/all',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const data = await metadataRepository.find();
                return res.success(data);
            },
        ],
    },
    findOneByKey: {
        path: '/metadata/detail/:key',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const metadata = await metadataRepository.findOne({key: req.params.key});
                if (!metadata) return res.error(NOT_EXISTS);

                return res.success(metadata);
            },
        ],
    },
    /*
     *  Admin Role
     */

    paginate: {
        path: '/metadata',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await metadataRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_metadata',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await metadataRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/metadata/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await metadataRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_metadata/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await metadataRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/metadata',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await metadataRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/metadata/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await metadataRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await metadataRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/metadata/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await metadataRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await metadataRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
    restore: {
        path: '/trash_metadata/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_METADATA_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await metadataRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await genreRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
