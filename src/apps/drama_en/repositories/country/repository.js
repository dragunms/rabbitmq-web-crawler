import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Country from './model';

class CountryRepository extends DataRepository {}

const countryRepository = new CountryRepository(mongoProvider.bindingModel(Country));
export default countryRepository;
