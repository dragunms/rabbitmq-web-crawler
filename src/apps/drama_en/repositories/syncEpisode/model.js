import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';
import {BOOLEAN_STATUS} from 'src/constants/status';

export default class SyncEpisode extends Model {
    beforeSave() {
        if (this.isChanged && !this.forceSynchronized) {
            this.is_synchronized = BOOLEAN_STATUS.FALSE;
        }
        super.beforeSave();
    }
}

SyncEpisode.database_name = 'drama_en';
SyncEpisode.table_name = 'sync_episode';
SyncEpisode.schema = createSchema({
    movie: {
        _id: {
            type: DataTypes.ID,
        },
        name: {
            type: DataTypes.STRING,
        },
        slug: {
            type: DataTypes.STRING,
        },
        thumb: {
            type: DataTypes.STRING,
        },
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
    },
    thumb: {
        type: DataTypes.STRING,
    },
    episode: {
        type: DataTypes.NUMBER,
    },
    type: {
        type: DataTypes.STRING,
    },
    hosted_links: [
        {
            _id: {id: false},
            type: {
                type: DataTypes.NUMBER,
            },
            url: DataTypes.STRING,
        },
    ],
    is_synchronized: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
