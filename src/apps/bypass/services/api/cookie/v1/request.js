import _ from 'lodash';
import {schemaBoolean, schemaID, schemaJSON, schemaObject, schemaString} from 'src/constants/validate';
import {ENUM_AVAILABLE_STATUS} from 'src/constants/enum';

export const paginateOptions = {
    searchFields: ['keywords'],
    sortFields: ['domain', 'proxy.ip', 'status'],
};

export const rulesCreate = {
    domain: schemaString(),
    agent: schemaString(),
    proxy: schemaObject({
        id: schemaID(),
        ip: schemaString(4, 100),
        port: schemaString(0, 6),
        username: schemaString(1, 32, true),
        password: schemaString(1, 32, true),
    }),
    data: schemaJSON(),

    status: {
        type: 'enum',
        values: ENUM_AVAILABLE_STATUS,
        optional: true,
    },

    protocol: schemaString(4, 5, true),
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        // eslint-disable-next-line no-param-reassign
        delete obj.domain;
        return {...obj, optional: true};
    }),
};
