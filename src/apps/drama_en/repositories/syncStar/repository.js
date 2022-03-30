import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import SyncStar from './model';

class SyncStarRepository extends DataRepository {}

const syncStarRepository = new SyncStarRepository(mongoProvider.bindingModel(SyncStar));
export default syncStarRepository;
