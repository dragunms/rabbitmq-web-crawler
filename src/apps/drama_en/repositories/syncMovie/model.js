import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';
import {BOOLEAN_STATUS} from 'src/constants/status';

export default class SyncMovie extends Model {
    beforeSave() {
        if (this.isChanged && !this.forceSynchronized) {
            this.is_synchronized = BOOLEAN_STATUS.FALSE;
        }
        super.beforeSave();
    }
}

SyncMovie.database_name = 'drama_en';
SyncMovie.table_name = 'sync_movie';
SyncMovie.schema = createSchema({
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
    director: {
        type: DataTypes.STRING,
    },
    country: {
        _id: {id: false},
        name: {
            type: DataTypes.STRING,
        },
        slug: {
            type: DataTypes.STRING,
        },
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
    released_year: {
        type: DataTypes.NUMBER,
    },
    movie_status: {
        type: DataTypes.STRING,
    },
    stars: [
        {
            _id: {id: false},
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
    ],
    episodes: [
        {
            _id: {id: false},
            slug: {
                type: DataTypes.STRING,
            },
        },
    ],
    is_synchronized: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});
