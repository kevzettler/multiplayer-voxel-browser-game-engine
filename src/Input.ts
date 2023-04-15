import NippleJS, { Joystick, JoystickOutputData } from 'nipplejs';
import KD from 'keydrown';

function gameplayContainerClick(
  dispatch: Function,
){
  dispatch({ type: "@INPUT/PRIMARY_TRIGGER" });
  this.requestPointerLock = this.requestPointerLock ||
                            this.msRequestPointerLock ||
                            this.mozRequestPointerLock ||
                            this.webkitRequestPointerLock;

  if(this.requestPointerLock){
    this.requestPointerLock();
  }
}

function gameplayContainerRelease(
  dispatch: Function
){
  dispatch({ type: "@INPUT/PRIMARY_RELEASE" });
}

function gameplayContainerMouseMove(
  dispatch: Function,
  browserMouseEvent: MouseEvent
){
  if(browserMouseEvent.movementX === 0 && browserMouseEvent.movementY === 0) return;
  dispatch({
    type: "@INPUT/LOOK",
    payload:{
      movementX: browserMouseEvent.movementX,
      movementY: browserMouseEvent.movementY,
    }
  });
}

export function desktopControls(
  document: Document,
  dispatch: Function
){
  const canvas = document.getElementById('gameplay-canvas');
  canvas.addEventListener("mousedown", gameplayContainerClick.bind(canvas, dispatch), false);
  canvas.addEventListener("mouseup", gameplayContainerRelease.bind(canvas, dispatch), false);
  canvas.addEventListener('mousemove', gameplayContainerMouseMove.bind(canvas, dispatch), false);

  KD.run(function KDRunTick() {KD.tick();});

  //Forward
  KD.W.press(() => dispatch({ type: "@INPUT/MOVE-FORWARD/PRESS" }));
  KD.W.up(() => dispatch({ type: "@INPUT/MOVE-FORWARD/UP" }));

  //Back
  KD.S.press(() => dispatch({ type: "@INPUT/MOVE-BACK/PRESS" }));
  KD.S.up(() => dispatch({ type: "@INPUT/MOVE-BACK/UP" }));

  //Left
  KD.A.press(() => dispatch({ type: "@INPUT/MOVE-LEFT/PRESS" }));
  KD.A.up(() => dispatch({ type: "@INPUT/MOVE-LEFT/UP" }));

  //Right
  KD.D.press(() => dispatch({ type: "@INPUT/MOVE-RIGHT/PRESS" }));
  KD.D.up(() => dispatch({ type: "@INPUT/MOVE-RIGHT/UP" }));

  //Jump
  KD.SPACE.press(() => dispatch({ type: "@INPUT/JUMP/PRESS"}));
  KD.SPACE.up(() => dispatch({ type: "@INPUT/JUMP/UP" }));

  KD.ENTER.press(() => dispatch({ type: "@INPUT/CHAT" }));

  KD.TAB.press(() => dispatch({ type: "@INPUT/SCOREBOARD"}));
}

export function touchControls(
  document: Document,
  dispatch: Function
){
  document.addEventListener('touchmove', function(event: TouchEvent & {originalEvent?: any, scale?: number}) {
    event = event.originalEvent || event;
    if (event.scale !== 1) {
      event.preventDefault();
    }
  }, false);

  const mobileAttackBTN = document.createElement('div');
  mobileAttackBTN.id = `mobileAttackBTN`;
  mobileAttackBTN.innerText = "Fight";
  mobileAttackBTN.style.width =  '10vw';
  mobileAttackBTN.style.fontSize =  '3vw';
  mobileAttackBTN.style.textAlign =  'center';
  mobileAttackBTN.style.height =  '10vw';
  mobileAttackBTN.style.lineHeight =  '10vw';
  mobileAttackBTN.style.background =  '#666';
  mobileAttackBTN.style.display =  'block';
  mobileAttackBTN.style.position = 'absolute';
  mobileAttackBTN.style.zIndex = '9999';
  mobileAttackBTN.style.borderRadius = '69px';
  mobileAttackBTN.style.opacity = '0.7';
  mobileAttackBTN.style.right = '20vw';
  mobileAttackBTN.style.bottom = '15vh';
  mobileAttackBTN.style.boxShadow = '3px 7px 8px #000';
  mobileAttackBTN.addEventListener("touchstart", this.props.inputPrimaryTrigger);
  document.body.appendChild(mobileAttackBTN);

  const mobileJumpBtn = document.createElement('div');
  mobileJumpBtn.id = `mobileJumpBtn`;
  mobileJumpBtn.innerText = "Jump";
  mobileJumpBtn.style.width =  '10vw';
  mobileJumpBtn.style.fontSize =  '3vw';
  mobileJumpBtn.style.textAlign =  'center';
  mobileJumpBtn.style.height =  '10vw';
  mobileJumpBtn.style.lineHeight =  '10vw';
  mobileJumpBtn.style.background =  '#666';
  mobileJumpBtn.style.display =  'block';
  mobileJumpBtn.style.position = 'absolute';
  mobileJumpBtn.style.zIndex = '9999';
  mobileJumpBtn.style.borderRadius = '69px';
  mobileJumpBtn.style.opacity = '0.7';
  mobileJumpBtn.style.right = '5vw';
  mobileJumpBtn.style.bottom = '30vh';
  mobileJumpBtn.style.boxShadow = '3px 7px 8px #000';
  mobileJumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    this.props.inputJump(1);
  });

  mobileJumpBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    this.props.inputJump(0)
  });
  document.body.appendChild(mobileJumpBtn);



  ['left', 'right'].reduce((accum: {[index: string]: any}, float: string) => {
    //TODO move this into react components
    const controlPane = document.createElement('div');
    controlPane.id = `controlPane-${float}`;
    controlPane.style.width = '50%';
    controlPane.style.height = '100%';
    controlPane.style[<any>float] = '0px';
    controlPane.style.position = 'absolute';
    document.body.appendChild(controlPane);
    document.body.style.position = 'relative';
    document.getElementById('root').style.position = 'absolute';

    const touchInput = NippleJS.create({
      zone: document.getElementById(`controlPane-${float}`),
      color: 'black',
      dataOnly: false,
    });

    if(float === 'left'){
      touchInput.on('added', (evt, data) => {
        touchInput.on('plain:up', () => {
          this.props.inputMove([0,1]);
        });

        touchInput.on('plain:down', () => {
          this.props.inputMove([0,-1]);
        });

        touchInput.on('plain:left', () => {
          this.props.inputMove([1, -1]);
        });

        touchInput.on('plain:right', () => {
          this.props.inputMove([1, 1]);
        });

        touchInput.on('move', (evt:any, data: JoystickOutputData) => {
          if(!data.direction){
            this.props.inputMove([0, 0]);
            this.props.inputMove([1, 0]);
          }
        });

        touchInput.on('end', () => {
          this.props.inputMove([0, 0]);
          this.props.inputMove([1, 0]);
        });
      });
    }

    if(float === 'right'){
      touchInput.on('added', (evt, rage) => {
        touchInput.on('move', (evt, data) => {
          if(data.direction){
            this.props.inputLook({
              movementX: (data.direction.x === 'right' ? 1 : -1) * data.distance * data.force * 0.2,
              movementY: (data.direction.y === 'up' ? -1 : 1) * data.distance * data.force * 0.2
            })
          }
        });

        /* nipple.on('end', (evt, data) => {
         *   this.props.inputLookClear();
         * });*/
      });
    }

    touchInput.on('removed', () => {
      touchInput.destroy();
    });

    accum[float] = touchInput;

    return accum;
  }, {});
}
