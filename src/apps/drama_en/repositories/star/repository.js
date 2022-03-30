import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Star from './model';

class StarRepository extends DataRepository {}

const starRepository = new StarRepository(mongoProvider.bindingModel(Star));
export default starRepository;
