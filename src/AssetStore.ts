import { Buffer } from 'buffer/';
import { observable, action, makeObservable } from 'mobx';
import fetchPonyFill from 'fetch-ponyfill'
import ClientStore from './ClientStore'
import RootStore from './RootStore';
import { EntityDef, getEntityAssetFiles } from './AssetDependency';


const {fetch} = fetchPonyFill();

const assetProcessMap: {[index: string]: Function} = {
  'aoverts': (arrayBuffer: ArrayBuffer) => Buffer.from(arrayBuffer),
  'json': (arrayBuffer: ArrayBuffer) => {
    const uInt = new Uint8Array(arrayBuffer);
    let jsonChunks: string[] = [];
    for(let i =0; i < uInt.length; i++){
      jsonChunks.push(String.fromCharCode(uInt[i]));
    }
    const jsonString = jsonChunks.join('');
    return JSON.parse(jsonString);
  }
};

function processRawAsset(assetPayload: {assetName: string, arrayBuffer: ArrayBuffer}){
  const {assetName, arrayBuffer} = assetPayload;
  const nameChunks = assetName.split('.');
  const extension = nameChunks[nameChunks.length-1];
  try{
    if(assetProcessMap[extension]) return assetProcessMap[extension](arrayBuffer);
  }catch(ex){
    console.error('failed to process asset ', assetName, assetPayload.arrayBuffer.byteLength);
    console.error(ex);
  }
  return assetPayload.arrayBuffer;
}

export default class AssetStore {
  rootStore;
  loadedAssets: {[index: string]: any} = {};

  constructor(rootStore: ClientStore | RootStore){
    makeObservable(this, {
      loadedAssets: observable,
      fetchBinary: action,
      fetchList: action,
      fetchEntityAssets: action
    });

    this.rootStore = rootStore;
  }

  async fetchBinary(assetName: string) {
    if(this.loadedAssets[assetName]) return this.loadedAssets[assetName];
    const assetURI = this.rootStore.assetPath + '/' + assetName;

    try {
      const response = await fetch(assetURI);
      if(!response.ok) throw new Error(`${assetURI} fetch Failed ${response.status}`)

      const arrayBuffer = await response.arrayBuffer();
      const processedAsset = processRawAsset({
        assetName,
        arrayBuffer,
      })
      this.loadedAssets[assetName] = processedAsset;
      console.log(`loaded asset: ${assetName}`);
    }catch(ex) {
      console.error(`fecth Failed ${assetURI}: ${ex.message}`);
    }
  }

  async fetchList(assetList: string[]) {
    await Promise.all(assetList.map(async (assetName: string) => {
      await this.fetchBinary(assetName);
    }));
  }

  async fetchEntityAssets(entityList: EntityDef[]) {
    await this.fetchList(
      entityList.flatMap((e: EntityDef) => getEntityAssetFiles(e))
    )
  }
}
