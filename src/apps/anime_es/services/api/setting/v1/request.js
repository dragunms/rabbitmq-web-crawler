import _ from 'lodash';
import {schemaBoolean, schemaString} from 'src/constants/validate';

export const paginateOptions = {
    searchFields: [],
    sortFields: [],
};

export const rulesCreate = {
    name: schemaString(1, 50),
    key: schemaString(3, 30),
    value: schemaString(0, 1000),
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {...obj, optional: true};
    }),
};
