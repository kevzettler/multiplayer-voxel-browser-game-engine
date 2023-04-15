//This defaults to browser worker implementation and then
//webpack replaces this depending on client v server environment
// Not sure of a better way to do this at the moment
// might have to reproduce the hack from threads.js https://github.com/andywer/threads.js/blob/master/src/worker_threads.ts
// not sure that works with webpack 5 though as they override the webpack requires and use eval
//@ts-ignore
import WorkerImplementation from './implementation.browser';
export default WorkerImplementation
