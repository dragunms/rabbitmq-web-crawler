import _ from 'lodash';
import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {BOOLEAN_STATUS, PRIVATE_STATUS} from 'src/constants/status';

export default class Episode extends Model {
    beforeSave() {
        const metaTitle = `Watch episode ${this.anime.name} online`;
        const metaKeywords = _.trim(`${this.anime.name}, ${this.anime.other_name ? this.anime.other_name : ''}`, ', ').replace(/ \//g, ',');
        const metaDescription = this.intro;

        this.generateMeta(metaTitle, metaDescription, metaKeywords);
        super.beforeSave();
    }
}

Episode.database_name = 'anime_en';
Episode.table_name = 'episode';
Episode.schema = createSchema({
    anime: {
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
        anime_status: {
            type: DataTypes.NUMBER,
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
        country: {
            type: DataTypes.STRING,
        },
    },
    view: {
        type: DataTypes.NUMBER,
    },
    is_latest: {
        type: DataTypes.NUMBER,
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
    },
    download_slug: {
        type: DataTypes.STRING,
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
            url: {
                type: DataTypes.STRING,
            },
            name: {
                type: DataTypes.STRING,
            },
            slug: {
                type: DataTypes.STRING,
            },
        },
    ],
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
    },
    ...DefaultAttributes.SOFT_DELETE,
    ...DefaultAttributes.META_DATA,
});
