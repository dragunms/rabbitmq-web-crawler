import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import SyncMovie from './model';

class SyncMovieRepository extends DataRepository {}

const syncMovieRepository = new SyncMovieRepository(mongoProvider.bindingModel(SyncMovie));
export default syncMovieRepository;
