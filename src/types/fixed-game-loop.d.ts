declare module 'fixed-game-loop'{
  interface loopOptions{
    update?: Function,
    render?: Function,
    onPause?: Function,
    onResume?: Function,
    autoStart?: boolean,
  }

  export default class Timer {
    constructor(options: loopOptions)
    isPaused(): boolean;
    start(): boolean;
    pause(): boolean;
    resume(): boolean;
    togglePause(): boolean;
    _elapsed: number;
    _tickCount: number;
    _curTime: number;
    _fixedDeltaTime: number;
  }
}
