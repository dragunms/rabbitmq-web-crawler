import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';
import {AVAILABLE_STATUS} from 'src/constants/status';

export default class Cookie extends Model {}

Cookie.database_name = 'bypass';
Cookie.table_name = 'cookie';
Cookie.schema = createSchema({
    proxy: {
        id: DataTypes.ID,
        ip: DataTypes.STRING,
        port: DataTypes.STRING,
        username: DataTypes.STRING,
        password: DataTypes.STRING,
    },
    agent: {
        type: DataTypes.STRING,
    },
    data: {
        type: DataTypes.STRING,
    },
    protocol: {
        type: DataTypes.STRING,
        default: 'https',
    },
    domain: {
        type: DataTypes.STRING,
        text: true,
    },
    count: {
        type: DataTypes.INTEGER,
        default: 0,
    },
    version: {
        type: DataTypes.NUMBER,
        default: 0,
    },
    status: {
        type: DataTypes.NUMBER,
        default: AVAILABLE_STATUS.AVAILABLE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
