import {createSchema, MongoDataTypes as DataTypes, MongoModel as Model} from '@azteam/mongo-model';

import {BOOLEAN_STATUS} from 'src/constants/status';

export default class Version extends Model {}

Version.database_name = 'drama_en';
Version.table_name = 'version';
Version.schema = createSchema({
    key: {
        type: DataTypes.STRING,
        unique: true,
    },
    version: {
        type: DataTypes.STRING,
        default: '1.0.1',
    },
    is_web: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
    },
    is_app: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
    },
});
