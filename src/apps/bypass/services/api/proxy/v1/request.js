import _ from 'lodash';

import {schemaBoolean, schemaString} from 'src/constants/validate';
import {ENUM_AVAILABLE_STATUS} from 'src/constants/enum';

export const paginateOptions = {
    searchFields: ['keywords'],
    sortFields: ['status'],
};

export const rulesCreate = {
    ip: schemaString(4, 100),
    port: schemaString(0, 6),
    username: schemaString(1, 32, true),
    password: schemaString(1, 32, true),

    status: {
        type: 'enum',
        values: ENUM_AVAILABLE_STATUS,
        optional: true,
    },
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        // eslint-disable-next-line no-param-reassign
        delete obj.ip;
        return {...obj, optional: true};
    }),
};
