import React from 'react';
import ClientStore from '../ClientStore'
import BasePlayer from '../BasePlayer'
import { getAssetListFromItems } from '../AssetDependency'

type ColorStruct = {
  r: number,
  g: number,
  b: number,
  a: number
};

type Palette = Array<ColorStruct>;


function fetchPalette(): Palette{
  let palette = localStorage.getItem('palette');
  if(palette){
    return JSON.parse(localStorage.getItem('palette'));
  }

  return[
    {"r":0.26666666666666666,"g":0.26666666666666666,"b":0.26666666666666666,"a":1},
    {"r":0.8313725490196079,"g":0.41568627450980394,"b":0.050980392156862744,"a":1},
    {"r":0.4666666666666667,"g":0.5882352941176471,"b":0.6039215686274509,"a":1},
    {"r":1,"g":1,"b":1,"a":1}
  ];
}


type ItemMap = {
  head: string;
  core: string;
  arms: string;
  legs: string;
  booster: string;
  weapon: string
}

export type PlayerState = {
  userName: string;
  skeleton: string;
  palette: Palette;
  items: ItemMap;
}


export function fetchLocalStoragePlayerData(): PlayerState{
  const localStoragePlayer = {
    userName: localStorage.getItem('userName') || 'Guest',
    skeleton: 'mechSniperActions',
    palette: fetchPalette() ||
             [{"r":0.26666666666666666,"g":0.26666666666666666,"b":0.26666666666666666,"a":1},{"r":0.8313725490196079,"g":0.41568627450980394,"b":0.050980392156862744,"a":1},{"r":0.4666666666666667,"g":0.5882352941176471,"b":0.6039215686274509,"a":1},{"r":1,"g":1,"b":1,"a":1}],

    items:  JSON.parse(localStorage.getItem('items')) || {
      head: 'standardHead',
      core: 'standardCore',
      arms: 'standardArms',
      legs: 'standardLegs',
      booster: 'standardBooster',
      weapon: 'standardGun',
    },
  }

  return localStoragePlayer;
}

const initialState = fetchLocalStoragePlayerData()

const rootStore = new ClientStore({
  actionMap:null,
});

const BP = new BasePlayer({
  rootStore,
  position: [100, 0, -100],
  rotation: [0, 0.9999735576321609, 0, 0.007272141118422239],
  broadPhaseBoxPadding: [15, 9, 15],
  color: [0,1,1,0.8],
  palette:  [
    {"r":1,"g":1,"b":0.403921568627451,"a":1},
    {"r":0,"g":0,"b":0,"a":1},
    {"r":0.4588235294117647,"g":0.4588235294117647,"b":0.27450980392156865,"a":1},
    {"r":0.9803921568627451,"g":0.9764705882352941,"b":0.4196078431372549,"a":1},
    {"r":0.7490196078431373,"g":0.09019607843137255,"b":0.6039215686274509,"a":1}
  ],
  items: initialState.items,
});

export const PlayerContext = React.createContext<BasePlayer>(BP);

export default function PlayerProvider({ children }: {children: React.ReactNode}){
  React.useEffect(() => {
    async function fetchAssets(){
      const assetNames = getAssetListFromItems(initialState.items);
      await rootStore.assetStore.fetchList(assetNames)
      BP.assetFiles = assetNames;
    }
    fetchAssets();
  }, []);

  return (
    <PlayerContext.Provider value={BP}>
      {children}
    </PlayerContext.Provider>
  );
}
