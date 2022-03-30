import _ from 'lodash';
import moment from 'moment';
import {toSlug} from '@azteam/util';
import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {BOOLEAN_STATUS, PRIVATE_STATUS} from 'src/constants/status';

export default class Star extends Model {
    beforeSave() {
        const name = this.name.replace(/\(\d+\)/, '').trim();
        if (!this.slug) {
            this.slug = toSlug(name);
        }

        const metaTitle = `${name}`;
        const metaKeywords = _.trim(`${name}, ${this.other_name ? this.other_name : ''}`, ', ').replace(/ \//g, ',');
        const metaDescription = `${name}${this.other_name ? ` (${this.other_name})` : ''} born ${moment
            .unix(this.birthday_at)
            .format('MMM, DD, YYYY')} in ${this.address}. Now! Watch more ${name}’s Movie series here!`;

        this.generateMeta(metaTitle, metaDescription, metaKeywords, this.thumb);
        super.beforeSave();
    }
}

Star.database_name = 'drama_en';
Star.table_name = 'star';
Star.schema = createSchema({
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
    view: {
        type: DataTypes.NUMBER,
        index: true,
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
Star.schema.index({
    name: 'text',
    other_name: 'text',
});
