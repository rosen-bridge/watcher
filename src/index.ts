import './bootstrap';
import init from './init';

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (process.env.NODE_ENV === undefined || process.env.NODE_ENV !== 'test') {
  init().then(() => null);
}
