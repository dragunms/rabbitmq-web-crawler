import _ from 'lodash';

import {schemaBoolean, schemaEmail, schemaID, schemaPassword, schemaPhoneNumber, schemaString} from 'src/constants/validate';
import {ENUM_ACCOUNT_STATUS} from 'src/constants/enum';

export const paginateOptions = {
    searchFields: ['email', 'phone_number'],
    sortFields: ['position_id'],
};

export const rulesCreate = {
    email: schemaEmail(),
    name: schemaString(1, 50),
    status: {
        type: 'enum',
        values: ENUM_ACCOUNT_STATUS,
    },

    password: schemaPassword(true),
    position_id: schemaID(true),
    phone_number: schemaPhoneNumber(true),
};
export const rulesModify = {
    forceModify: schemaBoolean(true),
    ..._.mapValues(rulesCreate, function (obj) {
        return {...obj, optional: true};
    }),
};
