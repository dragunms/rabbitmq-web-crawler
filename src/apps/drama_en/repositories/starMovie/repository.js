import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import StarMovie from './model';

class StarMovieRepository extends DataRepository {}

const starMovieRepository = new StarMovieRepository(mongoProvider.bindingModel(StarMovie));
export default starMovieRepository;
