import _ from 'lodash';
import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {BOOLEAN_STATUS, PRIVATE_STATUS} from 'src/constants/status';

export default class Episode extends Model {
    beforeSave() {
        const metaTitle = `Watch episode ${this.name} online`;
        const metaKeywords = _.trim(`${this.name}, ${this.other_name ? this.other_name : ''}`, ', ').replace(/ \//g, ',');
        const metaDescription = this.intro;

        this.generateMeta(metaTitle, metaDescription, metaKeywords);
        super.beforeSave();
    }
}

Episode.database_name = 'drama_en';
Episode.table_name = 'episode';
Episode.schema = createSchema({
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
    server_links: [
        {
            _id: {id: false},
            type: {
                type: DataTypes.NUMBER,
            },
            url: {
                type: DataTypes.STRING,
            },
        },
    ],
    hosted_links: [
        {
            _id: {id: false},
            type: {
                type: DataTypes.NUMBER,
            },
            url: {
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
