import StaticVoxelMesh from './StaticVoxelMesh';
import { getAssetListFromItems } from './AssetDependency';
import AIPlayer from './AIPlayer';
import RootStore from './RootStore';
import Cube from './Cube'

export default async function(rootStore: RootStore){
  // Test Cube
  /* new (Entity.behaves(
   *   CollisionHull,
   *   BroadPhaseBox,
   *   Geometry))
   * ({
   *   id:"test-cube",
   *   ...makeCube(100),
   *   rootStore,
   *   position: [200,50,0],
   *   color: [1,1,0,1]
   * }) */

  // Test Box
  new Cube({
    rootStore,
    id:"test-box",
    position: [-300,70,100],
    color: [0.4,1,0,1],
    cubeDimensions: [100, 20, 100]
  })

  const baddieItems = {
    head: 'geordiHead',
    core: 'standardCore',
    arms: 'standardArms',
    legs: 'standardLegs',
    booster: 'wingBooster',
    weapon: 'standardSword',
  }
  const baddieAssets = getAssetListFromItems(baddieItems);
  await rootStore.assetStore.fetchList(baddieAssets);

  new AIPlayer({
    rootStore,
    id: 'baddie-root',
    position: [100, 0, -100],
    userName: 'ServerDaemon',
    rotation: [0, 0.9999735576321609, 0, 0.007272141118422239],
    assetFiles: baddieAssets,
    collider: true,
    broadPhaseBoxPadding: [15, 9, 15],
    color: [0,1,1,0.8],
    palette:  [
      {"r":1,"g":1,"b":0.403921568627451,"a":1},
      {"r":0,"g":0,"b":0,"a":1},
      {"r":0.4588235294117647,"g":0.4588235294117647,"b":0.27450980392156865,"a":1},
      {"r":0.9803921568627451,"g":0.9764705882352941,"b":0.4196078431372549,"a":1},
      {"r":0.7490196078431373,"g":0.09019607843137255,"b":0.6039215686274509,"a":1}
    ],
    items: baddieItems,
  });


  await rootStore.assetStore.fetchList([
    'chr_fatkid.aoverts',
    'obj_house1a.aoverts',
    'obj_house4.aoverts',
    'tree1.aoverts',
    'ramp.aoverts',
  ]);

  new StaticVoxelMesh({
    id: 'tree',
    position: [50,0,0],
    assetFiles: ['tree1.aoverts'],
    rootStore
  });


  new StaticVoxelMesh({
    id: 'ramp',
    position: [-200,0,0],
    assetFiles: ['ramp.aoverts'],
    rootStore,
  });

  new StaticVoxelMesh({
    id: 'fat-kid-mesh',
    position: [-50,0, 100],
    assetFiles:['chr_fatkid.aoverts'],
    rootStore
  });

  new StaticVoxelMesh({
    id:"house",
    position: [100,0,200],
    assetFiles: ['obj_house1a.aoverts'],
    rootStore
  })

  new StaticVoxelMesh({
    id: 'house2',
    position: [-100,0,200],
    assetFiles: ['obj_house4.aoverts'],
    rootStore
  })
}
