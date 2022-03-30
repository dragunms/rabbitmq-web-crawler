import _ from 'lodash';

import {rulesMetadata, schemaBoolean, schemaImage, schemaString} from 'src/constants/validate';

export const paginateOptions = {
    searchFields: [],
    sortFields: [],
};

export const rulesCreate = {
    key: schemaString(3, 30),
    screenshot: schemaImage(true),
    ...rulesMetadata,
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {...obj, optional: true};
    }),
};
