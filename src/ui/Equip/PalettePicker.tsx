import React from 'react';
import { CustomPicker } from 'react-color';
import { Hue, Saturation } from 'react-color/lib/components/common';

import styles from '../styles/Equip.css';

class PalettePicker extends React.Component<{onChange: (palette:any) => void}> {
  render() {
    return (
      <div>
        <div className={styles.satCont}>
          <Saturation {...this.props} />
        </div>
        <div className={styles.hueCont}>
          <Hue {...this.props} />
        </div>
      </div>
    )
  }
}

export default CustomPicker(PalettePicker);
