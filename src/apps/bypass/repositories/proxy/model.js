import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {AVAILABLE_STATUS} from 'src/constants/status';

export default class Proxy extends Model {}

Proxy.database_name = 'bypass';
Proxy.table_name = 'proxy';
Proxy.schema = createSchema({
    ip: {
        type: DataTypes.STRING,
        text: true,
    },
    port: {
        type: DataTypes.STRING,
    },
    username: {
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.NUMBER,
        default: AVAILABLE_STATUS.AVAILABLE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
