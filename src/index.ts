import 'reflect-metadata';
import { init } from './init';

if (process.env.NODE_ENV === undefined || process.env.NODE_ENV !== 'test') {
  init().then(() => null);
}
