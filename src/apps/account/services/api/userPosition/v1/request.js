import _ from 'lodash';
import {schemaBoolean, schemaInteger, schemaString} from 'src/constants/validate';

export const paginateOptions = {
    searchFields: [],
    sortFields: [],
};

export const rulesCreate = {
    name: schemaString(1, 50),
    roles: {
        type: 'array',
        items: schemaInteger(),
        default: [],
    },
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {...obj, optional: true};
    }),
};
