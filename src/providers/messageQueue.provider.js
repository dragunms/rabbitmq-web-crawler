import config from 'config';
import {RabbitMQProvider} from '@azteam/rabbitmq-async';

const messageQueueProvider = new RabbitMQProvider(config.get('CONNECTION.RABBIT_MQ'));

export default messageQueueProvider;
