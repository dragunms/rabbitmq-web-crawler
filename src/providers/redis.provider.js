import config from 'config';
import {RedisProvider} from '@azteam/redis-async';

const redisProvider = new RedisProvider(config.get('CONNECTION.REDIS'));

export default redisProvider;
