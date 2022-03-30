import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Genre from './model';

class GenreRepository extends DataRepository {}

const genreRepository = new GenreRepository(mongoProvider.bindingModel(Genre));
export default genreRepository;
