import _ from 'lodash';

import {schemaBoolean, schemaString, schemaVersion} from 'src/constants/validate';

export const paginateOptions = {
    searchFields: [],
    sortFields: [],
};

export const rulesCreate = {
    key: schemaString(3, 30),
    version: schemaVersion(),
    is_web: schemaBoolean(),
    is_app: schemaBoolean(),
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {...obj, optional: true};
    }),
};
