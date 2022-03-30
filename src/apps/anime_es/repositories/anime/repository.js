import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Anime from './model';

class AnimeRepository extends DataRepository {}

const animeRepository = new AnimeRepository(mongoProvider.bindingModel(Anime));
export default animeRepository;
