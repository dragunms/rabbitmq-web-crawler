import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

export default class Metadata extends Model {}

Metadata.database_name = 'anime_en';
Metadata.table_name = 'metadata';
Metadata.schema = createSchema({
    key: {
        type: DataTypes.STRING,
        unique: true,
    },
    screenshot: {
        type: DataTypes.STRING,
    },
    ...DefaultAttributes.META_DATA,
    ...DefaultAttributes.SOFT_DELETE,
});
