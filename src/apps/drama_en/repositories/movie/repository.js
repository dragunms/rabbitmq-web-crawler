import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Movie from './model';

class MovieRepository extends DataRepository {}

const movieRepository = new MovieRepository(mongoProvider.bindingModel(Movie));
export default movieRepository;
