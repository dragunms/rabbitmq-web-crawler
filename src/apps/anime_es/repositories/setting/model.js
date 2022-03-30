import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

export default class Setting extends Model {}

Setting.database_name = 'anime_es';
Setting.table_name = 'setting';
Setting.schema = createSchema({
    name: {
        type: DataTypes.STRING,
    },
    key: {
        type: DataTypes.STRING,
        unique: true,
    },
    value: {
        type: DataTypes.STRING,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
