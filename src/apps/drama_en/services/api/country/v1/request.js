import _ from 'lodash';

import {schemaBoolean, schemaSlug, schemaString} from 'src/constants/validate';
import {ENUM_PRIVATE_STATUS} from 'src/constants/enum';

export const filterOptions = {};

export const paginateOptions = {
    searchFields: ['keywords'],
};

export const rulesCreate = {
    name: schemaString(),
    slug: schemaSlug(),
    description: schemaString(1, 255),
    status: {
        type: 'enum',
        values: ENUM_PRIVATE_STATUS,
    },
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {
            ...obj,
            optional: true,
        };
    }),
};
