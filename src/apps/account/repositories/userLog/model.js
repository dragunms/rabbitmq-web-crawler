import {createSchema, MongoDataTypes as DataTypes, MongoModel as Model} from '@azteam/mongo-model';

export default class UserLog extends Model {}

UserLog.database_name = 'account';
UserLog.table_name = 'user_log';
UserLog.schema = createSchema({
    ip: {
        type: DataTypes.STRING,
    },
    os: {
        type: DataTypes.STRING,
    },
    device: {
        type: DataTypes.STRING,
    },
});
