import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

export default class StarMovie extends Model {}

StarMovie.database_name = 'drama_en';
StarMovie.table_name = 'star_movie';
StarMovie.schema = createSchema({
    star: {
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
    movie: {
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
    ...DefaultAttributes.SOFT_DELETE,
    ...DefaultAttributes.META_DATA,
});
