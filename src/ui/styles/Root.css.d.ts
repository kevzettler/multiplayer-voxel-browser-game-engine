declare namespace RootCssNamespace {
  export interface IRootCss {
    "gameplay-container": string;
    root: string;
    statsContainer: string;
  }
}

declare const RootCssModule: RootCssNamespace.IRootCss & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: RootCssNamespace.IRootCss;
};

export = RootCssModule;
