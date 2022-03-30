import _ from 'lodash';
import {HTTP_METHOD, paginateMiddleware, REQUEST_TYPE, roleMiddleware, validateMiddleware} from '@azteam/express';
import {NOT_EXISTS, PERMISSION} from '@azteam/error';

import * as ROLES from 'src/constants/role';
import {USER_POSITION_ROLE} from 'src/constants/role';
import {USER_LEVEL} from 'src/constants/system';

import {rulesID} from 'src/constants/validate';

import userPositionRepository from 'src/apps/account/repositories/userPosition/repository';

import {paginateOptions, rulesCreate, rulesModify} from './request';
import {allowResponse, guardResponse} from './response';

const FULL_ROLE = _.flatMapDeep(ROLES, (role) => _.values(role));

async function getMyPosition(user) {
    let myPosition = null;
    if (user.level === USER_LEVEL.SYSTEM) {
        myPosition = {
            roles: FULL_ROLE,
            name: 'Boss',
        };
    } else if (user.position) {
        myPosition = await userPositionRepository.findOneById(user.position);
    }
    return myPosition;
}

export default {
    /*
     *  Common Role
     */
    findRole: {
        path: '/user_positions/all',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const userPositions = await userPositionRepository.find();
                return res.success(userPositions, ['roles']);
            },
        ],
    },

    /*
     *  Profile Role
     */
    myPosition: {
        path: '/user_positions/my_position',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware(),
            async function (req, res) {
                const myPosition = await getMyPosition(req.user);
                if (myPosition) {
                    return res.success(myPosition);
                }
                return res.error(PERMISSION);
            },
        ],
    },
    /*
     *  Admin Role
     */

    paginate: {
        path: '/user_positions',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_POSITION_ROLE.READ], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await userPositionRepository.find(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },
    paginateTrash: {
        path: '/trash_user_positions',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_POSITION_ROLE.RESTORE], USER_LEVEL.ADMIN),
            paginateMiddleware(paginateOptions),
            async function (req, res) {
                const paginateData = await userPositionRepository.findTrash(req.query, req.paginate);

                return res.success(paginateData, guardResponse, allowResponse);
            },
        ],
    },

    findOne: {
        path: '/user_positions/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_POSITION_ROLE.READ], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await userPositionRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },
    findOneTrash: {
        path: '/trash_user_positions/:id',
        type: HTTP_METHOD.GET,
        method: [
            roleMiddleware([USER_POSITION_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await userPositionRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);
                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    create: {
        path: '/user_positions',
        type: HTTP_METHOD.POST,
        method: [
            roleMiddleware([USER_POSITION_ROLE.CREATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.BODY, rulesCreate),
            async function (req, res) {
                const myPosition = await getMyPosition(req.user);
                req.body.roles = _.intersection(myPosition.roles, req.body.roles);

                const item = await userPositionRepository.createByUser(req.user.id, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    modify: {
        path: '/user_positions/:id',
        type: HTTP_METHOD.PUT,
        method: [
            roleMiddleware([USER_POSITION_ROLE.UPDATE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            validateMiddleware(REQUEST_TYPE.BODY, rulesModify),
            async function (req, res) {
                let item = await userPositionRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                const myPosition = await getMyPosition(req.user);
                req.body.roles = _.intersection(myPosition.roles, req.body.roles);

                item = await userPositionRepository.modifyByUser(req.user.id, item, req.body);

                return res.success(item, guardResponse, allowResponse);
            },
        ],
    },

    delete: {
        path: '/user_positions/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([USER_POSITION_ROLE.DELETE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await userPositionRepository.findOneById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await userPositionRepository.deleteByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
    restore: {
        path: '/trash_user_positions/:id',
        type: HTTP_METHOD.DEL,
        method: [
            roleMiddleware([USER_POSITION_ROLE.RESTORE], USER_LEVEL.ADMIN),
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesID),
            async function (req, res) {
                const item = await userPositionRepository.findOneTrashById(req.params.id);
                if (!item) return res.error(NOT_EXISTS);

                await userPositionRepository.restoreByUser(req.user.id, item);
                return res.success(true);
            },
        ],
    },
};
