import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';
import {BOOLEAN_STATUS} from 'src/constants/status';

export default class SyncAnime extends Model {
    beforeSave() {
        if (this.isChanged && !this.forceSynchronized) {
            this.is_synchronized = BOOLEAN_STATUS.FALSE;
        }
        super.beforeSave();
    }
}

SyncAnime.database_name = 'anime_en';
SyncAnime.table_name = 'sync_anime';
SyncAnime.schema = createSchema({
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
    thumb: {
        type: DataTypes.STRING,
    },
    intro: {
        type: DataTypes.STRING,
    },
    type: {
        type: DataTypes.STRING,
        index: true,
    },
    sub_category: {
        name: {
            type: DataTypes.STRING,
        },
        slug: {
            type: DataTypes.STRING,
        },
    },
    view: {
        type: DataTypes.NUMBER,
    },
    genres: [
        {
            _id: {id: false},
            name: {
                type: DataTypes.STRING,
            },
            slug: {
                type: DataTypes.STRING,
            },
        },
    ],
    country: {
        type: DataTypes.STRING,
    },
    released_year: {
        type: DataTypes.NUMBER,
    },
    anime_status: {
        type: DataTypes.NUMBER,
    },
    is_synchronized: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
