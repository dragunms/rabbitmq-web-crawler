import config from 'config';
import {MongoProvider} from '@azteam/mongo-model';

const mongoProvider = new MongoProvider(config.get('CONNECTION.MONGO'));
export default mongoProvider;
