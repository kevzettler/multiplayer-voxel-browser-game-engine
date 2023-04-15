export interface IPaletteStruct{
  r:number
  g:number
  b:number
  a:number
}
export type Palette = Array<IPaletteStruct>;


export function fetchPalette(): Palette{
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


export type Item = {
  guid: string;
  type: string;
  name: string;
};

export type ItemMap = {
  [index: string]: string
  "head": string;
  "core": string;
  "arms": string;
  "legs": string;
  "booster": string;
  "weapon": string
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
