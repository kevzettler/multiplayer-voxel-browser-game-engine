import { observable, computed, action, makeObservable } from 'mobx';
import isUUID from 'is-uuid';
import Entity from './Entity';
import StaticVoxelMesh from './StaticVoxelMesh';
import AIPlayer from './AIPlayer';
import RootStore from './RootStore'
import ClientStore from './ClientStore'
import Cube from './Cube'
import Bullet from './Bullet'
import BEHAVIORS from './Behaviors';

import RemotePlayer from './RemotePlayer';

import LocalPlayer from './LocalPlayer';

const ENTITY_TYPES: {[index: string]: any} = {
  StaticVoxelMesh,
  AIPlayer,
  RemotePlayer,
  Cube,
  Bullet
};


interface IEntityIndex{
  [index: string]: any
  // TODO how to type the entity index?
  // It could return any permuation of entities and behaviorrs
}

export const entityReplacer = (key:string, value: any) => {
  if(key === 'rootStore') return undefined;
  if(key === 'localSnaps') return undefined;
  return value;
}

export default class EntityStore {
  rootStore
  entityRenderPayload: any[] = []
  lastTick = {};
  entityIndex: IEntityIndex = {};

  constructor(rootStore: RootStore | ClientStore){
    makeObservable(this, {
      entityIndex: observable,
      addEntity: action,
      entityAssetIds: computed,
      ids: computed({keepAlive: true}),
      entityRefList: computed({keepAlive: true}),
      updateEntities: action,
      removeEntity: action,
      playerRoots: computed({keepAlive: true}),
      rootEntities: computed({keepAlive: true}),
      networkReplicatedEntities: computed({keepAlive: true}),
      syncServerEntities: action,
      processServerEntities: action,
      serverEntityUpdate: action
    });

    this.rootStore = rootStore;
  }

  // TODO entity is going to be a generic constrained mixin with variety of shapes
  async addEntity(entity: any) {
    if(entity.id && this.entityIndex[entity.id]){
      new Error(`Failed to add ${entity.id} an entity with that id already exists`);
    }

    this.entityIndex[entity.id] = entity;
    return entity;
  }

  get entityAssetIds() {
    return Object.values(this.entityIndex).flatMap(e => e.assetIds);
  }

  get ids() {
    return Object.keys(this.entityIndex);
  }

  get localPlayer(): LocalPlayer{
    return this.entityIndex[this.rootStore.uuid];
  }

  get entityRefList() {
    return Object.values(this.entityIndex);
  }

  updateEntities(dt:number, elapsed:number, tickCount:number) {
    this.lastTick = {dt, elapsed, tickCount};
    this.entityRefList.forEach(function iterateEntities (entity: any){
      return entity.emit('tick', dt, elapsed, tickCount);
    });
  }

  removeEntity(entityId: string) {
    if(entityId === this.rootStore.uuid) {
      console.error('removeEntity tried to delete local player?')
      return;
    }
    const entityRef = this.entityIndex[entityId]
    if(!entityRef) return console.warn(`removeEntity ${entityId} does not exist`);

    if(entityRef.childIds.length){
      entityRef.childIds.forEach((childId: string) => this.removeEntity(childId));
    }

    this.entityIndex[entityId] = null;
    delete this.entityIndex[entityId];
  }

  get playerRoots() {
    return Object.values(this.entityIndex).filter((entity) => {
      return isUUID.v1(entity.id);
    })
  }

  get rootEntities() {
    return Object.values(this.entityIndex).filter((entity) => {
      return !entity.parentId
    })
  }

  get networkReplicatedEntities() {
    return Object.entries(this.entityIndex).reduce((
      acc: {[index: string]: any},
      [entityId, entity],
    ) => {
      if(entity.networkSnaps){
        acc[entityId] = entity;
      }
      return acc;
    }, {});
  }

  async syncServerEntities(time: number, serverEntities: IEntityIndex) {
    await this.processServerEntities(time, serverEntities);
    // remove local network replicated entities that are not in server snapshot
    // they may have disconnected
    Object.entries(this.entityIndex)
          .forEach(([entityKey, entityRef]: [string, any]) => {
            if(entityRef.networkSnaps && !serverEntities[entityKey]){
              this.removeEntity(entityKey)
            }
          });
  }

  async processServerEntities(time: number, serverEntities: IEntityIndex) {
    // update existing entities
    Object.values(serverEntities).forEach((entity) => this.serverEntityUpdate(time, entity))
  }

  async serverEntityUpdate(time:number, entity: any) {
    if(!this.entityIndex[entity.id]){
      // if the entity has an explict type use that as a constructor
      if(entity.type && ENTITY_TYPES[entity.type]){
        console.log(`new ${entity.type}`, entity.id);

        if(entity.assetFiles){
          await this.rootStore.assetStore.fetchList(entity.assetFiles);
        }

        new ENTITY_TYPES[entity.type]({
          ...entity,
          rootStore: this.rootStore
        });
        // If the entity is generic with a set of behaviors reconstruct those behaviors
      }else if(entity.behaviors){
        if(!entity.behaviors.length){
          throw new Error('undefined remote entity type and no behaviors');
        }
        console.log("new behaviors", entity.id,  entity.behaviors);
        new (Entity.behaves(...entity.behaviors.map((b: any) => BEHAVIORS[b.toString() as keyof typeof BEHAVIORS])))({
          ...entity,
          rootStore: this.rootStore
        });
      }else{
        console.error(`unknown entity behavior ${entity.type}  ${entity.behaviors}`);
      }
    }else{
      if(!this.entityIndex[entity.id].networkSnap){
        //console.error('failed to network snap', entity.id);
        return;
      }
      this.entityIndex[entity.id].networkSnap({
        time,
        entity
      });
    }
  }
}
