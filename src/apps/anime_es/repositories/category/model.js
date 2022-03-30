import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {PRIVATE_STATUS} from 'src/constants/status';

export default class SubCategory extends Model {
    beforeSave() {
        const metaTitle = this.name;
        const metaKeywords = this.name;
        const metaDescription = this.description ? this.description : this.name;

        this.generateMeta(metaTitle, metaDescription, metaKeywords);
        super.beforeSave();
    }
}

SubCategory.database_name = 'anime_es';
SubCategory.table_name = 'category';
SubCategory.schema = createSchema({
    name: {
        type: DataTypes.STRING,
        text: true,
    },
    slug: {
        type: DataTypes.STRING,
        unique: true,
    },
    status: {
        type: DataTypes.NUMBER,
        default: PRIVATE_STATUS.PUBLIC,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
    ...DefaultAttributes.META_DATA,
});
