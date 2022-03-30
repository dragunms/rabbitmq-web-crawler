import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Episode from './model';

class EpisodeRepository extends DataRepository {}

const episodeRepository = new EpisodeRepository(mongoProvider.bindingModel(Episode));
export default episodeRepository;
