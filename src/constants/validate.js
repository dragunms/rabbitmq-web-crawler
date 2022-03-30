import {MongoDataTypes} from '@azteam/mongo-model';

import {ENUM_GENDER, ENUM_PLATFORM} from 'src/constants/enum';

/* schema */

export const schemaID = (optional = false) => ({
    type: 'objectID',
    ObjectID: MongoDataTypes.ID,
    optional,
});

export const schemaEmail = (optional = false) => ({
    type: 'email',
    optional,
});

export const schemaUrl = (optional = false) => ({
    type: 'url',
    optional,
});

export const schemaGender = (optional = false) => ({
    type: 'enum',
    values: ENUM_GENDER,
    optional,
});
export const schemaBoolean = (optional = false) => ({
    type: 'boolean',
    convert: true,
    optional,
});

export const schemaDate = (optional = false) => ({
    type: 'number',
    convert: true,
    integer: true,
    optional,
});

export const schemaNumber = (optional = false) => ({
    type: 'number',
    convert: true,
    optional,
});
export const schemaInteger = (min = 0, max = 999999999, optional = false) => ({
    type: 'number',
    integer: true,
    convert: true,
    min,
    max,
    optional,
});

export const schemaString = (min = 1, max = 255, optional = false) => ({
    type: 'string',
    min,
    max,
    optional,
});
export const schemaPassword = (optional = false) => ({
    type: 'string',
    min: 6,
    max: 32,
    optional,
});
export const schemaOTP = (optional = false) => ({
    type: 'string',
    length: 6,
    pattern: /\d+/,
    optional,
});
export const schemaImage = (optional = false) => ({
    type: 'string',
    max: 255,
    optional,
});
export const schemaVideo = (optional = false) => ({
    type: 'string',
    max: 255,
    optional,
});
export const schemaPhoneNumber = (optional = false) => ({
    type: 'string',
    length: 10,
    pattern: /^((09|03|07|08|05)+([0-9]{8})\b)$/,
    optional,
});
export const schemaSlug = (optional = false) => ({
    type: 'string',
    pattern: /[A-Za-z0-9_-]+/,
    max: 300,
    optional,
});
export const schemaVersion = (optional = false) => ({
    type: 'string',
    pattern: /^(\d+)\.(\d+)\.(\d+)$/,
    max: 300,
    optional,
});
export const schemaJSON = (optional = false) => ({
    type: 'json',
    optional,
});

export const schemaGallery = (optional = false) => ({
    type: 'array',
    items: schemaImage(),
    optional,
});

export const schemaObject = (props = {}, optional = false) => ({
    type: 'object',
    strict: 'remove',
    props,
    optional,
});
/* rules */

export const rulesID = {
    id: schemaID(),
};
export const rulesSlug = {
    slug: schemaSlug(),
};
export const rulesPlatformType = {
    type: {
        type: 'enum',
        values: ENUM_PLATFORM,
    },
};
export const rulesMetadata = {
    metadata_disable: schemaBoolean(true),
    metadata_title: schemaString(0, 255, true),
    metadata_title_og: schemaString(0, 255, true),
    metadata_description: schemaString(0, 255, true),
    metadata_description_og: schemaString(0, 255, true),
    metadata_keywords: schemaString(0, 255, true),
    metadata_image_url: schemaImage(true),
};
