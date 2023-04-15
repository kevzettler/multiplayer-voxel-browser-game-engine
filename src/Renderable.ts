import { mat4, glMatrix } from 'gl-matrix';
import { computed, action, observable, makeObservable } from 'mobx';
import { ConstrainedMixin } from './types/ConstrainedMixin';
import Entity from './Entity';
import { IGeometry}  from './Geometry';
import { IAssetDependant } from './AssetDependency';
import { IAnimate } from './Animate';
import regl from 'react-regl'
import { IPaletteStruct, Palette } from './util/localStorage'

glMatrix.setMatrixArrayType(Array);
export const defaultColorPalette = [[0,1,0,1],[0.9882352941176471,0.9882352941176471,0.9882352941176471,1],[0.9882352941176471,0.9882352941176471,0.8,1],[0.9882352941176471,0.9882352941176471,0.596078431372549,1],[0.9882352941176471,0.9882352941176471,0.39215686274509803,1],[0.9882352941176471,0.9882352941176471,0.18823529411764706,1],[0.9882352941176471,0.9882352941176471,0,1],[0.9882352941176471,0.8,0.9882352941176471,1],[0.9882352941176471,0.8,0.8,1],[0.9882352941176471,0.8,0.596078431372549,1],[0.9882352941176471,0.8,0.39215686274509803,1],[0.9882352941176471,0.8,0.18823529411764706,1],[0.9882352941176471,0.8,0,1],[0.9882352941176471,0.596078431372549,0.9882352941176471,1],[0.9882352941176471,0.596078431372549,0.8,1],[0.9882352941176471,0.596078431372549,0.596078431372549,1],[0.9882352941176471,0.596078431372549,0.39215686274509803,1],[0.9882352941176471,0.596078431372549,0.18823529411764706,1],[0.9882352941176471,0.596078431372549,0,1],[0.9882352941176471,0.39215686274509803,0.9882352941176471,1],[0.9882352941176471,0.39215686274509803,0.8,1],[0.9882352941176471,0.39215686274509803,0.596078431372549,1],[0.9882352941176471,0.39215686274509803,0.39215686274509803,1],[0.9882352941176471,0.39215686274509803,0.18823529411764706,1],[0.9882352941176471,0.39215686274509803,0,1],[0.9882352941176471,0.18823529411764706,0.9882352941176471,1],[0.9882352941176471,0.18823529411764706,0.8,1],[0.9882352941176471,0.18823529411764706,0.596078431372549,1],[0.9882352941176471,0.18823529411764706,0.39215686274509803,1],[0.9882352941176471,0.18823529411764706,0.18823529411764706,1],[0.9882352941176471,0.18823529411764706,0,1],[0.9882352941176471,0,0.9882352941176471,1],[0.9882352941176471,0,0.8,1],[0.9882352941176471,0,0.596078431372549,1],[0.9882352941176471,0,0.39215686274509803,1],[0.9882352941176471,0,0.18823529411764706,1],[0.9882352941176471,0,0,1],[0.8,0.9882352941176471,0.9882352941176471,1],[0.8,0.9882352941176471,0.8,1],[0.8,0.9882352941176471,0.596078431372549,1],[0.8,0.9882352941176471,0.39215686274509803,1],[0.8,0.9882352941176471,0.18823529411764706,1],[0.8,0.9882352941176471,0,1],[0.8,0.8,0.9882352941176471,1],[0.8,0.8,0.8,1],[0.8,0.8,0.596078431372549,1],[0.8,0.8,0.39215686274509803,1],[0.8,0.8,0.18823529411764706,1],[0.8,0.8,0,1],[0.8,0.596078431372549,0.9882352941176471,1],[0.8,0.596078431372549,0.8,1],[0.8,0.596078431372549,0.596078431372549,1],[0.8,0.596078431372549,0.39215686274509803,1],[0.8,0.596078431372549,0.18823529411764706,1],[0.8,0.596078431372549,0,1],[0.8,0.39215686274509803,0.9882352941176471,1],[0.8,0.39215686274509803,0.8,1],[0.8,0.39215686274509803,0.596078431372549,1],[0.8,0.39215686274509803,0.39215686274509803,1],[0.8,0.39215686274509803,0.18823529411764706,1],[0.8,0.39215686274509803,0,1],[0.8,0.18823529411764706,0.9882352941176471,1],[0.8,0.18823529411764706,0.8,1],[0.8,0.18823529411764706,0.596078431372549,1],[0.8,0.18823529411764706,0.39215686274509803,1],[0.8,0.18823529411764706,0.18823529411764706,1],[0.8,0.18823529411764706,0,1],[0.8,0,0.9882352941176471,1],[0.8,0,0.8,1],[0.8,0,0.596078431372549,1],[0.8,0,0.39215686274509803,1],[0.8,0,0.18823529411764706,1],[0.8,0,0,1],[0.596078431372549,0.9882352941176471,0.9882352941176471,1],[0.596078431372549,0.9882352941176471,0.8,1],[0.596078431372549,0.9882352941176471,0.596078431372549,1],[0.596078431372549,0.9882352941176471,0.39215686274509803,1],[0.596078431372549,0.9882352941176471,0.18823529411764706,1],[0.596078431372549,0.9882352941176471,0,1],[0.596078431372549,0.8,0.9882352941176471,1],[0.596078431372549,0.8,0.8,1],[0.596078431372549,0.8,0.596078431372549,1],[0.596078431372549,0.8,0.39215686274509803,1],[0.596078431372549,0.8,0.18823529411764706,1],[0.596078431372549,0.8,0,1],[0.596078431372549,0.596078431372549,0.9882352941176471,1],[0.596078431372549,0.596078431372549,0.8,1],[0.596078431372549,0.596078431372549,0.596078431372549,1],[0.596078431372549,0.596078431372549,0.39215686274509803,1],[0.596078431372549,0.596078431372549,0.18823529411764706,1],[0.596078431372549,0.596078431372549,0,1],[0.596078431372549,0.39215686274509803,0.9882352941176471,1],[0.596078431372549,0.39215686274509803,0.8,1],[0.596078431372549,0.39215686274509803,0.596078431372549,1],[0.596078431372549,0.39215686274509803,0.39215686274509803,1],[0.596078431372549,0.39215686274509803,0.18823529411764706,1],[0.596078431372549,0.39215686274509803,0,1],[0.596078431372549,0.18823529411764706,0.9882352941176471,1],[0.596078431372549,0.18823529411764706,0.8,1],[0.596078431372549,0.18823529411764706,0.596078431372549,1],[0.596078431372549,0.18823529411764706,0.39215686274509803,1],[0.596078431372549,0.18823529411764706,0.18823529411764706,1],[0.596078431372549,0.18823529411764706,0,1],[0.596078431372549,0,0.9882352941176471,1],[0.596078431372549,0,0.8,1],[0.596078431372549,0,0.596078431372549,1],[0.596078431372549,0,0.39215686274509803,1],[0.596078431372549,0,0.18823529411764706,1],[0.596078431372549,0,0,1],[0.39215686274509803,0.9882352941176471,0.9882352941176471,1],[0.39215686274509803,0.9882352941176471,0.8,1],[0.39215686274509803,0.9882352941176471,0.596078431372549,1],[0.39215686274509803,0.9882352941176471,0.39215686274509803,1],[0.39215686274509803,0.9882352941176471,0.18823529411764706,1],[0.39215686274509803,0.9882352941176471,0,1],[0.39215686274509803,0.8,0.9882352941176471,1],[0.39215686274509803,0.8,0.8,1],[0.39215686274509803,0.8,0.596078431372549,1],[0.39215686274509803,0.8,0.39215686274509803,1],[0.39215686274509803,0.8,0.18823529411764706,1],[0.39215686274509803,0.8,0,1],[0.39215686274509803,0.596078431372549,0.9882352941176471,1],[0.39215686274509803,0.596078431372549,0.8,1],[0.39215686274509803,0.596078431372549,0.596078431372549,1],[0.39215686274509803,0.596078431372549,0.39215686274509803,1],[0.39215686274509803,0.596078431372549,0.18823529411764706,1],[0.39215686274509803,0.596078431372549,0,1],[0.39215686274509803,0.39215686274509803,0.9882352941176471,1],[0.39215686274509803,0.39215686274509803,0.8,1],[0.39215686274509803,0.39215686274509803,0.596078431372549,1],[0.39215686274509803,0.39215686274509803,0.39215686274509803,1],[0.39215686274509803,0.39215686274509803,0.18823529411764706,1],[0.39215686274509803,0.39215686274509803,0,1],[0.39215686274509803,0.18823529411764706,0.9882352941176471,1],[0.39215686274509803,0.18823529411764706,0.8,1],[0.39215686274509803,0.18823529411764706,0.596078431372549,1],[0.39215686274509803,0.18823529411764706,0.39215686274509803,1],[0.39215686274509803,0.18823529411764706,0.18823529411764706,1],[0.39215686274509803,0.18823529411764706,0,1],[0.39215686274509803,0,0.9882352941176471,1],[0.39215686274509803,0,0.8,1],[0.39215686274509803,0,0.596078431372549,1],[0.39215686274509803,0,0.39215686274509803,1],[0.39215686274509803,0,0.18823529411764706,1],[0.39215686274509803,0,0,1],[0.18823529411764706,0.9882352941176471,0.9882352941176471,1],[0.18823529411764706,0.9882352941176471,0.8,1],[0.18823529411764706,0.9882352941176471,0.596078431372549,1],[0.18823529411764706,0.9882352941176471,0.39215686274509803,1],[0.18823529411764706,0.9882352941176471,0.18823529411764706,1],[0.18823529411764706,0.9882352941176471,0,1],[0.18823529411764706,0.8,0.9882352941176471,1],[0.18823529411764706,0.8,0.8,1],[0.18823529411764706,0.8,0.596078431372549,1],[0.18823529411764706,0.8,0.39215686274509803,1],[0.18823529411764706,0.8,0.18823529411764706,1],[0.18823529411764706,0.8,0,1],[0.18823529411764706,0.596078431372549,0.9882352941176471,1],[0.18823529411764706,0.596078431372549,0.8,1],[0.18823529411764706,0.596078431372549,0.596078431372549,1],[0.18823529411764706,0.596078431372549,0.39215686274509803,1],[0.18823529411764706,0.596078431372549,0.18823529411764706,1],[0.18823529411764706,0.596078431372549,0,1],[0.18823529411764706,0.39215686274509803,0.9882352941176471,1],[0.18823529411764706,0.39215686274509803,0.8,1],[0.18823529411764706,0.39215686274509803,0.596078431372549,1],[0.18823529411764706,0.39215686274509803,0.39215686274509803,1],[0.18823529411764706,0.39215686274509803,0.18823529411764706,1],[0.18823529411764706,0.39215686274509803,0,1],[0.18823529411764706,0.18823529411764706,0.9882352941176471,1],[0.18823529411764706,0.18823529411764706,0.8,1],[0.18823529411764706,0.18823529411764706,0.596078431372549,1],[0.18823529411764706,0.18823529411764706,0.39215686274509803,1],[0.18823529411764706,0.18823529411764706,0.18823529411764706,1],[0.18823529411764706,0.18823529411764706,0,1],[0.18823529411764706,0,0.9882352941176471,1],[0.18823529411764706,0,0.8,1],[0.18823529411764706,0,0.596078431372549,1],[0.18823529411764706,0,0.39215686274509803,1],[0.18823529411764706,0,0.18823529411764706,1],[0.18823529411764706,0,0,1],[0,0.9882352941176471,0.9882352941176471,1],[0,0.9882352941176471,0.8,1],[0,0.9882352941176471,0.596078431372549,1],[0,0.9882352941176471,0.39215686274509803,1],[0,0.9882352941176471,0.18823529411764706,1],[0,0.9882352941176471,0,1],[0,0.8,0.9882352941176471,1],[0,0.8,0.8,1],[0,0.8,0.596078431372549,1],[0,0.8,0.39215686274509803,1],[0,0.8,0.18823529411764706,1],[0,0.8,0,1],[0,0.596078431372549,0.9882352941176471,1],[0,0.596078431372549,0.8,1],[0,0.596078431372549,0.596078431372549,1],[0,0.596078431372549,0.39215686274509803,1],[0,0.596078431372549,0.18823529411764706,1],[0,0.596078431372549,0,1],[0,0.39215686274509803,0.9882352941176471,1],[0,0.39215686274509803,0.8,1],[0,0.39215686274509803,0.596078431372549,1],[0,0.39215686274509803,0.39215686274509803,1],[0,0.39215686274509803,0.18823529411764706,1],[0,0.39215686274509803,0,1],[0,0.18823529411764706,0.9882352941176471,1],[0,0.18823529411764706,0.8,1],[0,0.18823529411764706,0.596078431372549,1],[0,0.18823529411764706,0.39215686274509803,1],[0,0.18823529411764706,0.18823529411764706,1],[0,0.18823529411764706,0,1],[0,0,0.9882352941176471,1],[0,0,0.8,1],[0,0,0.596078431372549,1],[0,0,0.39215686274509803,1],[0,0,0.18823529411764706,1],[0.9254901960784314,0,0,1],[0.8627450980392157,0,0,1],[0.7215686274509804,0,0,1],[0.6588235294117647,0,0,1],[0.5333333333333333,0,0,1],[0.4549019607843137,0,0,1],[0.32941176470588235,0,0,1],[0.26666666666666666,0,0,1],[0.12549019607843137,0,0,1],[0.06274509803921569,0,0,1],[0,0.9254901960784314,0,1],[0,0.8627450980392157,0,1],[0,0.7215686274509804,0,1],[0,0.6588235294117647,0,1],[0,0.5333333333333333,0,1],[0,0.4549019607843137,0,1],[0,0.32941176470588235,0,1],[0,0.26666666666666666,0,1],[0,0.12549019607843137,0,1],[0,0.06274509803921569,0,1],[0,0,0.9254901960784314,1],[0,0,0.8627450980392157,1],[0,0,0.7215686274509804,1],[0,0,0.6588235294117647,1],[0,0,0.5333333333333333,1],[0,0,0.4549019607843137,1],[0,0,0.32941176470588235,1],[0,0,0.26666666666666666,1],[0,0,0.12549019607843137,1],[0,0,0.06274509803921569,1],[0.9254901960784314,0.9254901960784314,0.9254901960784314,1],[0.8627450980392157,0.8627450980392157,0.8627450980392157,1],[0.7215686274509804,0.7215686274509804,0.7215686274509804,1],[0.6588235294117647,0.6588235294117647,0.6588235294117647,1],[0.5333333333333333,0.5333333333333333,0.5333333333333333,1],[0.4549019607843137,0.4549019607843137,0.4549019607843137,1],[0.32941176470588235,0.32941176470588235,0.32941176470588235,1],[0.26666666666666666,0.26666666666666666,0.26666666666666666,1],[0.12549019607843137,0.12549019607843137,0.12549019607843137,1],[0.06274509803921569,0.06274509803921569,0.06274509803921569,1]];
const placeHolderJoints = [...new Array(22)].map(() => mat4.identity(mat4.create()));

export interface IRenderPayload{
  id: string
  aomesh: any
  count: number
  joints: any[]
  colors: any
  //Static meshes like MVox verts
  // use packedJointAndPalette for palette only.
  jointPaletteSplit: number,
  animationOriginOffset: mat4,
}

function paletteStructToArray(palette: IPaletteStruct[]){
  return palette.map(ps => [ps.r,ps.g,ps.b,ps.a]);
}

type RenderableConstraint = ConstrainedMixin<Entity &
                            IGeometry &
                            IAssetDependant &
                            IAnimate &
                            {
                              palette?: IPaletteStruct[]
                              skeleton?: any
                              networkSnaps?: any[]
                              replicatedModelMat?: mat4
                            }>;

export default function Renderable<TBase extends RenderableConstraint>(superclass: TBase) {
  class Renderable extends superclass{
    palette: IPaletteStruct[] = null

    constructor(...args: any[]) {
      super(...args);

      makeObservable(this, {
        renderBuffer: computed({keepAlive: true}),
        colorBuffer: computed({keepAlive: true}),
        renderPayload: computed({keepAlive: true}),
        replicaRenderNode: computed({keepAlive: true}),
        palette: observable,
        setPalette: action,
      });

      const props = args[0]
      if(props.palette){
        this.palette = props.palette
      }
    }

    setPalette(palette: IPaletteStruct[]){
      this.palette = palette
    }

    get renderBuffer() {
      return regl.buffer({
        data: this.assetBuffer,
        usage: 'static',
        type: 'uint8',
      });
    }

    get colorBuffer() {
      const colorBuff = [];
      const palette = this.palette ?
                      paletteStructToArray(this.palette) :
                      defaultColorPalette;

      for(var i = 0; i< this.assetBuffer.length; i+=8){
        let paletteId = this.assetBuffer[i+7];
        // assume passed in palettes are QB models with the combined
        //joint+palette value need to extract true palette id
        if(this.palette){
          const float = paletteId / 10;
          const x = Math.floor(float);
          const y = Math.floor(Math.ceil(((float-x) * 100)) / 10);
          paletteId = y;
        }
        const colorVal = palette[paletteId];
        colorBuff.push(colorVal);
      }

      return regl.buffer({
        data: colorBuff,
        usage: 'static',
        type: 'float',
      });
    }

    get renderPayload() {
      if(!this.renderBuffer.length) return null;
      const jointPaletteSplit = this.skeleton ? 10.0 : 1.0;
      const joints = this.skeleton ?
                     this.animJoints :
                     //empty joints if no skeleton
                     placeHolderJoints;

      const aomesh = this.renderBuffer;

      return {
        id: this.id,
        aomesh,
        //@ts-ignore
        count: aomesh._buffer.byteLength/8,
        joints,
        colors: this.colorBuffer,
        //Static meshes like MVox verts
        // use packedJointAndPalette for palette only.
        jointPaletteSplit,
        animationOriginOffset: this.animationOriginOffset
      };
    }

    get replicaRenderNode() {
      if(this.networkSnaps && !this.parent){
        return {
          ...this.renderPayload,
          model: this.replicatedModelMat,
        }
      }else if(this.parent && this.parent.networkSnaps){
        return {
          ...this.renderPayload,
          model: mat4.multiply(
            mat4.create(),
            this.localModel,
            this.parent.replicatedModelMat,
          )
        }
      }

      return null;
    }
  }

  return Renderable;
}
