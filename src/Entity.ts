import { vec3, vec4, mat4, quat } from 'gl-matrix';
import { v1 as uuidv1 } from 'uuid';
import { EventEmitter2 } from 'eventemitter2';
import { action, observable, computed, makeObservable } from 'mobx';
import compose from 'lodash.flowright';
import ClientStore from './ClientStore';
import RootStore from './RootStore';

import {INetworkSnap} from './NetworkReplicated';

export interface IEntityProps {
  rootStore: RootStore,
  position?: vec3,
  rotation?: quat
  id?: string

  //The following properties belong to individeual behavior classes
  // and should live there. not sure how to setup the type structurre to support
  // that idea

  // These should be stored on Geometry
  geometryOffset?: vec3
  radius?: vec3

  //BroadPhaseBox
  broadPhaseBoxPadding?: vec3

  // Assest dependency?
  color?: vec4
}

export default class Entity extends EventEmitter2 {
  rootStore: ClientStore | RootStore = null
  id: string = uuidv1()
  parentId: string = null
  childIds: string[] = []
  behaviors: string[] = []
  type: string = 'Entity';

  // An entity may become network replicated by a parent entity
  // Feels like maybe this should all just live on the Entity implementation
  networkSnaps?: INetworkSnap[] = null
  networkSnap(networkSnap: INetworkSnap): void{}

  position: vec3 = [0,0,0];
  setPosition(position: vec3){ this.position = position }

  rotation: quat = [0,0,0,1];
  setRotation(rotation: quat){ this.rotation = rotation }

  localScale = 1;

  // mutatable memory place holders
  // shared between behaviors
  modelMatOut = mat4.create()

  static behaves(...behaviors: Array<Function>){
    const newEnt = compose.apply(
      null,
      behaviors,
    )(Entity);

    newEnt.behaviors = behaviors.map((behaviorClass) => behaviorClass.name);

    return newEnt;
  }

  addChild(child: Entity){
    child.parentId = this.id;
    this.childIds.push(child.id);
  }

  get children(){
    return this.childIds.map((childId) => {
      return this.rootStore.entityStore.entityIndex[childId];
    });
  }

  get parent(){
    return this.rootStore.entityStore.entityIndex[this.parentId]
  }

  constructor(...args: any[]){
    super({...args[0]});

    makeObservable(this, {
      position: observable,
      rotation: observable,
      localScale: observable,
      rootParentId: computed({keepAlive: true}),
      localModel: computed({keepAlive: true}),
      model: computed({keepAlive: true}),
      scale: computed({keepAlive: true}),
      setPosition: action,
      setRotation: action,
    });

    const props = args[0];

    // https://stackoverflow.com/questions/65398710/typescript-how-to-add-properties-to-object-constructor
    // @ts-ignore
    if(this.constructor.behaviors && this.constructor.behaviors.length){
      // @ts-ignore
      this.behaviors = this.constructor.behaviors.slice(0);
    }

    if(this.behaviors &&
       this.behaviors.indexOf(this.constructor.name) === -1){
      this.type = this.constructor.name;
    }

    if(props.position) this.position = props.position;
    if(props.rotation) this.rotation = props.rotation;
    if(props.id) this.id = props.id;
    Object.assign(this, props);

    this.rootStore = props.rootStore;
    this.rootStore.entityStore.addEntity(this);

    this.onAny((event, value) => {
      // This setTimeout is a hack so that the event listner
      // is applied to the children *after* this constructor has finished
      //
      setTimeout(() => {
        this.children.forEach((child) => {
          if(child){
            child.emit(event, value)
          }else{
            console.error(`${this.id} tried to emit ${event} on missing child? maybe deleting?`);
          }
        });
      }, 0);
    });
  }



  get scaleMultiplier(){
    return this.localScale;
  }

  // Iterate up parent ids to find the root parent grandparent node
  get rootParentId() {
    if(!this.parentId) return this.id;
    let parentRef = this.rootStore.entityStore.entityIndex[this.parentId]
    if(!parentRef){
      throw new Error(`failed to link parent entity for ${this.id} expected ${this.parentId}`);
    }
    while(parentRef.parentId){
      if(this.rootStore.entityStore.entityIndex[parentRef.parentId]){
        parentRef = this.rootStore.entityStore.entityIndex[parentRef.parentId];
      }else{
        break;
      }
    }

    return parentRef.id;
  }

  get localModel() {
    return mat4.fromRotationTranslationScale(
      // this should be cached to avoid garbage collection on new allocations
      // however that is breaking downstream computed caching
      mat4.create(),
      this.rotation,
      this.position,
      this.scale,
    );
  }

  get model() {
    if(this.parentId && this.rootStore.entityStore.entityIndex[this.parentId]){
      return mat4.multiply(
        mat4.create(),
        this.rootStore.entityStore.entityIndex[this.parentId].model,
        this.localModel
      )
    }else{
      return this.localModel;
    }
  }

  get scale(): vec3 {
    return [
      1 * this.scaleMultiplier,
      1 * this.scaleMultiplier,
      1 * this.scaleMultiplier,
    ]
  }
}
