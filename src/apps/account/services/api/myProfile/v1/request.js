import {schemaGender, schemaImage, schemaInteger, schemaPassword, schemaString} from 'src/constants/validate';

export const rulesChangeProfile = {
    name: schemaString(1, 50, true),
    gender: schemaGender(true),
    avatar: schemaImage(true),
    address: schemaString(0, 100, true),
    province_id: schemaInteger(0, 999999999, true),
    district_id: schemaInteger(0, 999999999, true),
};
export const rulesChangePassword = {
    password: schemaPassword(),
    new_password: schemaPassword(),
};
export const rulesCreatePassword = {
    new_password: schemaPassword(),
};
export const rulesCheckPassword = {
    password: schemaPassword(),
};
