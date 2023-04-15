declare module 'keydrown' {
  interface KeyObject{
    press(callback: Function): void;
    up(callback: Function): void;
  }

  const defaultExport: KD
  export default defaultExport

  export interface KD {
    run(callback: Function): void;
    tick(): void;
    ZERO:KeyObject
    ONE:KeyObject
    TWO:KeyObject
    THREE:KeyObject
    FOUR:KeyObject
    FIVE:KeyObject
    SEVEN:KeyObject
    EIGHT:KeyObject
    NINE:KeyObject
    A:KeyObject
    B:KeyObject
    C:KeyObject
    D:KeyObject
    E:KeyObject
    F:KeyObject
    G:KeyObject
    H:KeyObject
    I:KeyObject
    J:KeyObject
    K:KeyObject
    L:KeyObject
    M:KeyObject
    N:KeyObject
    O:KeyObject
    P:KeyObject
    Q:KeyObject
    R:KeyObject
    S:KeyObject
    T:KeyObject
    U:KeyObject
    V:KeyObject
    W:KeyObject
    X:KeyObject
    Y:KeyObject
    Z:KeyObject
    ENTER:KeyObject
    SHIFT:KeyObject
    ESC:KeyObject
    SPACE:KeyObject
    LEFT:KeyObject
    UP:KeyObject
    RIGHT:KeyObject
    DOWN:KeyObject
    BACKSPACE:KeyObject
    DELETE:KeyObject
    TAB:KeyObject
    TILDE:KeyObject
    CTRL:KeyObject
  }
}
