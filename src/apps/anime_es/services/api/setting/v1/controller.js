import config from 'config';
import {NOT_EXISTS} from '@azteam/error';
import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';

import {ANIME_ES_SETTING_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID} from 'src/constants/validate';

import settingRepository from 'src/apps/anime_es/repositories/setting/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';

import {allowResponse, guardResponse} from './response';

export default {
    /*
     *  Common Role
     */
    findToKeyValue: {
        path: '/settings/init',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const data = await settingRepository.find();
                const result = {};
                data.map(function (item) {
                    result[item.key] = item.value;
                    return true;
                });
                return res.success({
                    ...result,
                    FB_APP_ID: config.get('FACEBOOK_APP.APP_ID'),
                    GG_APP_ID_WEB: config.get('GOOGLE_APP.APP_ID_WEB'),
                });
            },
        ],
    },

    /*
     *  Admin Role
     */

    paginate: {
        path: '/settings',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await settingRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_settings',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await settingRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/settings/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await settingRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_settings/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await settingRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/settings',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await settingRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/settings/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await settingRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await settingRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/settings/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await settingRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await settingRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },

    restore: {
        path: '/trash_settings/:id',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([ANIME_ES_SETTING_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await settingRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await settingRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
