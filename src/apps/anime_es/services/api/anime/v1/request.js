import _ from 'lodash';

import {schemaBoolean, schemaSlug, schemaString} from 'src/constants/validate';
import {ENUM_PRIVATE_STATUS} from 'src/constants/enum';

export const filterOptions = {
    searchFields: ['keywords', 'genre', 'released_year', 'anime_status', 'type', 'other_name', 'letter', 'sub_category'],
    sortFields: ['view'],
};

export const paginateOptions = {
    searchFields: ['keywords'],
    sortFields: ['is_checked'],
};

export const rulesCreate = {
    name: schemaString(),
    slug: schemaSlug(),

    status: {
        type: 'enum',
        values: ENUM_PRIVATE_STATUS,
    },
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    is_checked: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {
            ...obj,
            optional: true,
        };
    }),
};
