import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import SyncAnime from './model';

class SyncAnimeRepository extends DataRepository {}

const syncAnimeRepository = new SyncAnimeRepository(mongoProvider.bindingModel(SyncAnime));
export default syncAnimeRepository;
