import React from 'react';
import rgbHex from '../../util/rgb-to-hex.js';
//@ts-ignore
import { Swatch } from 'react-color/lib/components/common';
import { ColorResult } from 'react-color';
import PalettePicker from './PalettePicker';
import classNames from 'classnames';
import styles from '../styles/Equip.css';
import { IPaletteStruct, Palette } from '../../util/localStorage.js';

const deNormalizeRGBA = (normalizedRGBAObject: IPaletteStruct): IPaletteStruct => {
  return {
      r: normalizedRGBAObject.r * 255,
      g: normalizedRGBAObject.g * 255,
      b: normalizedRGBAObject.b * 255,
      a: normalizedRGBAObject.a
    };
};


type ColorPaletteProps = {
  onChange: (palette: Palette) => void,
  palette: Palette
};

type ColorPaletteState = {
  paletteIndex: number
};

export default class ColorPalette extends React.Component<ColorPaletteProps, ColorPaletteState> {
  constructor(props:any){
    super(props)
    this.state = {
      paletteIndex: 1,
    }
  }

  handleChange(colorData: ColorResult){
    const newPalette = this.props.palette.slice(0);
    newPalette[this.state.paletteIndex] = {
      r:colorData.rgb.r / 255,
      g:colorData.rgb.g / 255,
      b:colorData.rgb.b / 255,
      a:1
    }
    this.props.onChange(newPalette);
  }

  swatchClick(paletteIndex: number){
    this.setState({
      paletteIndex
    })
  }

  shouldComponentUpdate(nextProps:ColorPaletteProps, nextState: ColorPaletteState){
    if(JSON.stringify(this.props.palette) !== JSON.stringify(nextProps.palette) ||
       this.state.paletteIndex !== nextState.paletteIndex){
      return true;
    }

    return false;
  }

  renderSwatches(){
    return this.props.palette.map((color: IPaletteStruct, index: number) => {
      const className = classNames({
        [styles.swatchWrap]: true,
        [styles.swatchWrapSelect]: index === this.state.paletteIndex
      })

      const hex = rgbHex.apply(this, Object.values(deNormalizeRGBA(color)));

      return (
        <div className={className} key={`swatch-${index}`}>
          <Swatch color={`#${hex}`}
                  onClick={this.swatchClick.bind(this, index)}
          />
        </div>
      );
    });
  }

  render(){
    return (
      <div style={{cursor: 'pointer'}}>
        <div className={styles.colorPalette}>
          {this.renderSwatches()}
        </div>
        <PalettePicker
          onChange={this.handleChange.bind(this)}
          color={ deNormalizeRGBA(this.props.palette[this.state.paletteIndex])}
        />
      </div>
    )
  }
}
