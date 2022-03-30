import _ from 'lodash';

import {schemaBoolean, schemaDate, schemaImage, schemaNumber, schemaSlug, schemaString} from 'src/constants/validate';
import {ENUM_PRIVATE_STATUS} from 'src/constants/enum';

export const paginateOptions = {
    searchFields: ['keywords'],
    sortFields: ['is_checked'],
};

export const rulesCreate = {
    name: schemaString(),
    slug: schemaSlug(),
    height: schemaNumber(),
    address: schemaString(1, 500),
    other_name: schemaString(1, 500),
    thumb: schemaImage(),
    birthday_at: schemaDate(true),
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
