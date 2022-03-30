import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import UserPosition from './model';

class UserPositionRepository extends DataRepository {}

const userPositionRepository = new UserPositionRepository(mongoProvider.bindingModel(UserPosition));
export default userPositionRepository;
