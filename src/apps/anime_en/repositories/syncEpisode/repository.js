import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import SyncEpisode from './model';

class SyncEpisodeRepository extends DataRepository {}

const syncEpisodeRepository = new SyncEpisodeRepository(mongoProvider.bindingModel(SyncEpisode));
export default syncEpisodeRepository;
