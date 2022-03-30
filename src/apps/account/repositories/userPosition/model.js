import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

export default class UserPosition extends Model {}

UserPosition.database_name = 'account';
UserPosition.table_name = 'user_position';
UserPosition.schema = createSchema({
    name: {
        type: DataTypes.STRING,
    },
    roles: {
        type: DataTypes.ARRAY,
        default: [],
    },
    ...DefaultAttributes.SOFT_DELETE,
});
