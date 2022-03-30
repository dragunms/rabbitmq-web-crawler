import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {PRIVATE_STATUS} from 'src/constants/status';

export default class Genre extends Model {
    beforeSave() {
        const metaTitle = this.name;
        const metaKeywords = this.name;
        const metaDescription = this.description ? this.description : this.name;

        this.generateMeta(metaTitle, metaDescription, metaKeywords);
        super.beforeSave();
    }
}

Genre.database_name = 'anime_en';
Genre.table_name = 'genre';
Genre.schema = createSchema({
    name: {
        type: DataTypes.STRING,
        text: true,
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
    },
    description: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.NUMBER,
        default: PRIVATE_STATUS.PUBLIC,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
    ...DefaultAttributes.META_DATA,
});
