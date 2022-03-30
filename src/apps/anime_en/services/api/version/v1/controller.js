import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS} from '@azteam/error';

import {SYSTEM_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';
import {rulesID, rulesPlatformType, schemaString} from 'src/constants/validate';

import versionRepository from 'src/apps/anime_en/repositories/version/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardResponse} from './response';

function increaseVersion(version) {
    const versionArr = version.trim().split('.');
    versionArr[2] = parseInt(versionArr[2], 10) + 1;
    return versionArr.join('.');
}

export default {
    /*
     *  Common Role
     */
    findToKeyValue: {
        path: '/versions/type/:type',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesPlatformType),
            async function (req, res) {
                const data = await versionRepository.findInit(req.params.type);
                return res.success(data);
            },
        ],
    },

    /*
     *  Admin Role
     */
    increaseVer: {
        path: '/versions/increase/:key',
        type: HTTP_METHOD.PUT,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, {
                key: schemaString(3, 30),
            }),
            roleMiddleware([SYSTEM_ROLE.UPDATE], USER_LEVEL.ADMIN),
            async function (req, res) {
                let version = await versionRepository.findOne({key: req.params.key});
                if (!version) return res.error(NOT_EXISTS);
                version = await versionRepository.modifyByUser(req.user.id, version, {
                    version: increaseVersion(version.version),
                });

                return res.success(version, guardResponse, allowResponse);
            },
        ],
    },

    paginate: {
        path: '/versions',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([SYSTEM_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await versionRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/versions/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([SYSTEM_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await versionRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/versions',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([SYSTEM_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const item = await versionRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/versions/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([SYSTEM_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await versionRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                item = await versionRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/versions/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([SYSTEM_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await versionRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await versionRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
