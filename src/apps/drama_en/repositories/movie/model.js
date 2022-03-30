import _ from 'lodash';
import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {BOOLEAN_STATUS, PRIVATE_STATUS} from 'src/constants/status';

export default class Movie extends Model {
    beforeSave() {
        this.letter = '0';
        if (this.name.match(/^[a-z]/i)) {
            this.letter = this.name.charAt(0).toUpperCase();
        }

        const metaTitle = `Watch drama ${this.name} online`;
        const metaKeywords = _.trim(`${this.name}, ${this.other_name ? this.other_name : ''}`, ', ').replace(/ \//g, ',');
        const metaDescription = this.intro;

        this.generateMeta(metaTitle, metaDescription, metaKeywords);
        super.beforeSave();
    }
}

Movie.database_name = 'drama_en';
Movie.table_name = 'movie';
Movie.schema = createSchema({
    name: {
        type: DataTypes.STRING,
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
    },
    letter: {
        type: DataTypes.STRING,
        index: true,
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
    country: {
        _id: {
            type: DataTypes.ID,
        },
        name: {
            type: DataTypes.STRING,
        },
        slug: {
            type: DataTypes.STRING,
        },
    },
    director: {
        type: DataTypes.STRING,
    },
    type: {
        type: DataTypes.STRING,
        index: true,
    },
    genres: [
        {
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
    status: {
        type: DataTypes.NUMBER,
        default: PRIVATE_STATUS.PUBLIC,
        index: true,
    },

    sync_id: {
        type: DataTypes.ID,
    },

    is_checked: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.TRUE,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
    ...DefaultAttributes.META_DATA,
});
Movie.schema.index({
    name: 'text',
    other_name: 'text',
});
