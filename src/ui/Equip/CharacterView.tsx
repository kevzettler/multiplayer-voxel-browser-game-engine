import React from 'react'
import { observer } from 'mobx-react-lite';
import AOVoxMesh from '../../AOVoxMesh';
import { vec3, quat, mat4 } from 'gl-matrix';
import styles from '../styles/Equip.css';
import regl, {ReglFrame} from 'react-regl';
import ContainerDimensions from 'react-container-dimensions'
import Ground from '../../Ground'
import ClientStore from '../../ClientStore'
import { PlayerMesh } from '../../BasePlayer'
import { getAssetListFromItems } from '../../AssetDependency'
import { Palette, ItemMap } from '../../util/localStorage'

const SHADOW_RES = 1024
const ShadowTex = regl.texture({
  width: SHADOW_RES,
  height: SHADOW_RES,
  wrap: 'clamp',
  type: 'half float'
})

const lightDir: vec3 = [4.5, 1000, 4.8]
const Camera = regl({
  uniforms: {
    view: mat4.lookAt(
      mat4.create(),
      [0, 30, -60],
      [0, 20, 0],
      [0, 1, 0]
    ),

    projection: ({ viewportWidth, viewportHeight }) =>
      mat4.perspective(
        mat4.create(),
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000
      ),

    lightDir,
    lightView: mat4.lookAt(
      mat4.create(),
      vec3.add(
        vec3.create(),
        [0,0,0],
        lightDir,
      ),
      [0,0,0],
      [0,1,0]
    ),
    lightProjection: mat4.ortho(
      mat4.create(),
      -400, // left
      400, // right
      -400, // bottom
      400, // top
      200, // near
      lightDir[1]+1000, // far
    ),

    shadowRes: SHADOW_RES,
    shadowMap: ShadowTex
  },

})

interface CharacterViewProps{
  items: ItemMap
  palette: Palette
  onItemsChange?: (items:ItemMap) => void
  onPaletteChange?: (palette:Palette) => void
}

const rootStore = new ClientStore({
  actionMap:null,
});
const playerMesh = new PlayerMesh({
  rootStore,
  id: "UI-CharacterView-mesh",
  assetFiles: [],
  palette: []
})
playerMesh.setRotation(quat.rotateY(
  quat.create(),
  playerMesh.rotation,
  -Math.PI
));
playerMesh.emit('movePress', 0,0, 'walk');

const bgColor: [number,number,number,number] = [0.40625, 0.94921, 0.996, 1];

const MeshObserver = observer(({playerMesh}: any) => {
  if(!playerMesh.renderPayload) return null;

  return (
    <AOVoxMesh
      {...playerMesh.renderPayload}
      id="Player Mesh"
      model={playerMesh.model}/>
  );
});

export default function CharacterView(props: CharacterViewProps){
  const { items, palette, onItemsChange, onPaletteChange } = props;
  const [mouseDown, setMouseDown] = React.useState(false);
  const [oldX, setOldX] = React.useState(0);

  React.useEffect(() => {
    async function fetchAssets(){
      const assetFiles = getAssetListFromItems(items);
      await rootStore.assetStore.fetchList(assetFiles);
      playerMesh.setAssetIds(assetFiles);
      if(typeof onItemsChange === 'function'){
        onItemsChange(items)
      }
    }
    fetchAssets();

    // reset the playerMesh on tear down
    return () => playerMesh.setAssetIds([]);
  }, [items])

  React.useEffect(() => {
    playerMesh.setPalette(palette)
    if(typeof onPaletteChange === 'function'){
      onPaletteChange(palette)
    }
  }, [palette])

  function mouseDownHandler(event: React.MouseEvent<HTMLDivElement>){
    setMouseDown(true);
    setOldX(event.pageX)
  }

  function mouseUp(event: React.MouseEvent){
    setMouseDown(false)
  }

  function mouseMove(event: React.MouseEvent){
    if(mouseDown){
      setOldX(event.pageX)

      const direction = event.pageX > oldX ? 1 : -1;
      const newRotation = quat.rotateY(
        quat.create(),
        playerMesh.rotation,
        0.1 * direction
      );

      playerMesh.setRotation(newRotation);
    }
  }

  function frameHandler({time}: any){
    regl.clear({color: bgColor, depth: 1})
    playerMesh.emit('tick', 0.016);
  }

  return (
    <div className={styles.characterViewHolder}
         onMouseDown={mouseDownHandler}
         onMouseUp={mouseUp}
         onMouseMove={mouseMove}>
      <ContainerDimensions>
        { ({ width, height }) =>
          <ReglFrame
            width={width}
            height={height}
            color={bgColor}
            extensions={['oes_texture_half_float']}
            onFrame={frameHandler}>
            <Camera id="Camera">
              <MeshObserver playerMesh={playerMesh}/>
              <Ground id="Ground"/>
            </Camera>
          </ReglFrame>
        }
      </ContainerDimensions>
    </div>
  );
}
