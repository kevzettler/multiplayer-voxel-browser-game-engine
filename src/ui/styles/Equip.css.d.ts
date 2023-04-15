declare namespace EquipCssNamespace {
  export interface IEquipCss {
    champTable: string;
    championListContainer: string;
    championViewContainer: string;
    characterAndColorsContainer: string;
    characterViewContainer: string;
    characterViewHolder: string;
    colorPalette: string;
    equipContent: string;
    equipmentListContainer: string;
    headerMenu: string;
    hover: string;
    hueCont: string;
    itemCell: string;
    nameInput: string;
    nameInputTable: string;
    satCont: string;
    selectedCell: string;
    siteHeader: string;
    swatchWrap: string;
    swatchWrapSelect: string;
  }
}

declare const EquipCssModule: EquipCssNamespace.IEquipCss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: EquipCssNamespace.IEquipCss;
};

export = EquipCssModule;
