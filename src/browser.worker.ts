import ClientStore from './ClientStore';
import RootStore from './RootStore';
import { glMatrix } from 'gl-matrix';
import { configure } from "mobx";
import actionMap from './actionMap';


configure({
  computedRequiresReaction: true
});


// Use Arrays for glmatrix constructors
glMatrix.setMatrixArrayType(Array);

const rootState = new ClientStore({
  actionMap,
  debug: {
    dispatchLog: (actionType: string) => {
      if (actionType.match(/tick/)) return false;
      if (actionType.match(/INPUT/)) return false;
      return true;
    },
    render: process.env.NODE_ENV === 'production' ? false : true,
    network: process.env.NODE_ENV === 'production' ? false : true,
    collisions: process.env.NODE_ENV === 'production' ? false : true,
    debugCamera: process.env.NODE_ENV === 'production' ? false : true
  }
});
declare global {
  interface Window {
    rootState: RootStore
  }
}
self.rootState = rootState;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    rootState.dispatch(event.data);
  } else {
    console.warn('unsure what to do with message passed to worker...', event);
  }
});
