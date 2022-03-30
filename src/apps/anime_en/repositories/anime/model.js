import _ from 'lodash';
import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {BOOLEAN_STATUS, PRIVATE_STATUS} from 'src/constants/status';

export default class Anime extends Model {
    beforeSave() {
        this.letter = 'Other';
        if (this.name.match(/^[a-z]/i)) {
            this.letter = this.name.charAt(0).toUpperCase();
        }

        const metaTitle = `Watch anime ${this.name} online`;
        const metaKeywords = _.trim(`${this.name}, ${this.other_name ? this.other_name : ''}`, ', ').replace(/ \//g, ',');
        const metaDescription = this.intro;

        this.generateMeta(metaTitle, metaDescription, metaKeywords);
        super.beforeSave();
    }
}

Anime.database_name = 'anime_en';
Anime.table_name = 'anime';
Anime.schema = createSchema({
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
    type: {
        type: DataTypes.STRING,
        index: true,
    },
    view: {
        type: DataTypes.NUMBER,
    },
    sub_category: {
        name: {
            type: DataTypes.STRING,
        },
        slug: {
            type: DataTypes.STRING,
        },
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
    anime_status: {
        type: DataTypes.NUMBER,
    },
    country: {
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
Anime.schema.index({
    name: 'text',
    other_name: 'text',
});
