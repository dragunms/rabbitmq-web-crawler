import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';
import {BOOLEAN_STATUS} from 'src/constants/status';

export default class SyncStar extends Model {
    beforeSave() {
        if (this.isChanged && !this.forceSynchronized) {
            this.is_synchronized = BOOLEAN_STATUS.FALSE;
        }
        super.beforeSave();
    }
}

SyncStar.database_name = 'drama_en';
SyncStar.table_name = 'sync_star';
SyncStar.schema = createSchema({
    name: {
        type: DataTypes.STRING,
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
    },
    other_name: {
        type: DataTypes.STRING,
    },
    birthday_at: {
        type: DataTypes.NUMBER,
        default: 0,
    },
    address: {
        type: DataTypes.STRING,
    },
    height: {
        type: DataTypes.NUMBER,
    },
    thumb: {
        type: DataTypes.STRING,
    },
    is_synchronized: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
