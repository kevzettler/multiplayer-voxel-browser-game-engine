import { vec3 } from 'gl-matrix';
import { observable, computed, action, makeObservable, autorun } from 'mobx';
import itemIndex from './items.json';
import boundingBox from 'vertices-bounding-box';
import { ConstrainedMixin } from './types/ConstrainedMixin';

import { IGeometry } from './Geometry';

import Entity from './Entity';

export function getAssetListFromItems(items: ItemMap){
  return Object.values(items).flatMap(
    (itemId: string) => (itemIndex as any)[itemId].assets)
}

export interface ItemMap {
  head: string
  core: string
  arms: string
  legs: string
  booster: string
  weapon: string
}

export interface EntityDef {
  assetFiles?: string[];
  items?: ItemMap
}

export function getEntityAssetFiles(entityDef: EntityDef): string[]{
  if(entityDef.assetFiles && entityDef.assetFiles.length){
    return entityDef.assetFiles;
  }else if(entityDef.items){
    return getAssetListFromItems(entityDef.items);
  }

  return [];
}

type AssetDependentMixin = ConstrainedMixin<Entity & IGeometry>;

export interface IAssetDependant{
  assetFiles: string[];
  assetAABB: [vec3,vec3]
  assetBuffer: Buffer
}


export default function AssetDependent<TBase extends AssetDependentMixin>(superclass: TBase){
  class AssetDependent extends superclass implements IAssetDependant {
    assetFiles: string[] = []

    constructor(...args: any[]){
      super(args[0]);

      makeObservable(this, {
        assetAABB: computed({keepAlive: true}),
        assetIds: computed,
        setAssetIds: action,
        assetFiles: observable,
        assetBuffer: computed({keepAlive: true})
      });

      const props = args[0];
      if(props.assetFiles) this.assetFiles = props.assetFiles;

      // Override the simplical complex
      // geometry with assetBuffer geometry
      const tris: vec3[][] = [[]];
      const originAssetVerts: vec3[] = [];

      autorun(() => {
        for(var i = 0; i< this.assetBuffer.length; i+=8){
          originAssetVerts.push([
            this.assetBuffer[i],
            this.assetBuffer[i+1],
            this.assetBuffer[i+2]
          ]);

          let lastTri: vec3[] = tris[tris.length-1];
          if(lastTri.length === 3) {
            tris.push([]);
            lastTri = tris[tris.length-1];
          }

          lastTri.push([
            this.assetBuffer[i],
            this.assetBuffer[i+1],
            this.assetBuffer[i+2]
          ]);
        }
        this.positions = originAssetVerts
        this.tris = tris;
      }, {
        name: "assetBuffer position update",
        onError: (err) => {
          console.error('AssetDependent Autorun failure');
          console.error(err);
        }
      });
    }

    get assetAABB() {
      return boundingBox(this.positions);
    }

    get assetIds(): string[] {
      return getEntityAssetFiles(this)
    }

    setAssetIds(assetFiles: string[]){
      this.assetFiles = assetFiles
    }

    get areAssetsLoaded(): boolean{
      this.assetIds.forEach((assetId) => {
        if(!this.rootStore.assetStore.loadedAssets[assetId]){
          return false;
        }
      });

      return true;
    }

    get assetBuffer(): Buffer {
      let result = Buffer.from([]);
      console.log('recalc assetBuffer');
      const loadedAssets = this.assetIds.map((aid: string) => this.rootStore.assetStore.loadedAssets[aid]);
      if(loadedAssets && loadedAssets.length){
        result = Buffer.concat(loadedAssets);
      }
      return result;
    }

  }

  return AssetDependent;
}
