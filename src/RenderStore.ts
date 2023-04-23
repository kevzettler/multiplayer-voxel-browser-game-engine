import reglInit from 'regl';
import reglDefer from 'react-regl';
import rregl from 'react-regl'
import { computed, makeObservable } from 'mobx';
import Camera from './Camera';
import Light from './Light';
import Ground, { ShadowGround } from './Ground';
import AOVoxMesh, { ShadowStaticAOMesh, ghostBlend } from './AOVoxMesh';
import Point from './Point';
import { vec3, vec4, mat4 } from 'gl-matrix';

import RootStore from './RootStore';
import ClientStore from './ClientStore';
import PlayerName from './PlayerName';

import DrawActors from './DrawActors';
import DrawFlat, { ShadowFlat, ShadedFlat } from './DrawFlat';
import DrawCamera from './DrawCamera';
import AxisHelper from './AxisHelper';
import TexQuad from './TexQuad';
import FrustrumVerts from './FrustrumVerts';

import flatVert from './shaders/flat.vert';
import flatFrag from './shaders/flat.frag';

import { IAssetDependant } from './AssetDependency';

const skyColor = [0.40625, 0.94921, 0.996, 1];
const SHADOW_RES = 1024;

const collideSphereOut = mat4.create();

// KIRI on 2d drawing
// -1 1 is top left screen coords


const skyClear = {
  color: skyColor,
  depth: 1
};

function makeTextCanvas(text: string, width: number, height: number) {
  var canvas = new OffscreenCanvas(width, height);
  var textCtx = canvas.getContext("2d");
  textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
  textCtx.canvas.width = width;
  textCtx.canvas.height = height;
  textCtx.font = "25px monospace";
  textCtx.textAlign = "center";
  textCtx.textBaseline = "middle";
  textCtx.strokeStyle = 'black';
  textCtx.lineWidth = 4;
  textCtx.lineJoin = "round";
  textCtx.miterLimit = 2;
  textCtx.strokeText(text, width / 2, height / 2);

  textCtx.fillStyle = "white";
  textCtx.fillText(text, width / 2, height / 2);
  return textCtx.canvas;
}

export default class RenderStore {
  camera: Camera = null
  light: Light = null
  canvas: HTMLCanvasElement = null
  regl: any = null
  rootStore

  constructor(rootStore: RootStore | ClientStore) {
    this.rootStore = rootStore;
    makeObservable(this, {
      staticAORenderPayload: computed({ keepAlive: true }),
      flatRenderPayload: computed({ keepAlive: true }),
      userNames: computed({ keepAlive: true }),
    });
  }

  resize(width: number, height: number) {
    this.camera.setViewPortDimensions(width, height)
    this.canvas.width = width;
    this.canvas.height = height;
    this.regl.poll();
  }

  get staticAORenderPayload() {
    return Object.values(this.rootStore.entityStore.entityIndex)
      .filter((e) => e.assetFiles && e.renderPayload)
      .map((e) => ({
        ...(e.renderPayload),
        id: e.id,
        model: e.model
      }));
  }

  get replicaRenderNodes() {
    return Object.values(this.rootStore.entityStore.entityIndex)
      .filter((e) => e.replicaRenderNode)
      .map((e) => (e.replicaRenderNode));
  }

  get flatRenderPayload() {
    return Object.values(this.rootStore.entityStore.entityIndex)
      .filter((e) => !e.assetFiles && e.cells.length && !e.collider)
  }

  get userNames(): any {
    return Object.values(this.rootStore.entityStore.entityIndex)
      .filter((e) => e.userName && e.id !== this.rootStore.uuid)
      .map((e) => ({
        model: mat4.translate(mat4.create(), e.model, [0, 50, 0]),
        tex: this.regl.texture({
          data: makeTextCanvas(e.userName, 200, 50),
          width: 100,
          height: 25,
          min: 'linear',
          premultiplyAlpha: true
        })
      }))
  }

  init(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    if (!canvas) {
      throw new Error(' no canvas passed to renderStore init');
    }
    this.canvas = canvas;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      stencil: false,
      preserveDrawingBuffer: false
    });

    // draw 2d HUD UI with Pixi overlayd the 3D
    /* this.UI = new PIXI.Application({
     *   width,
     *   height,
     *   view: canvas,
     *   preserveDrawingBuffer: true,
     *   clearBeforeRender: false,
     * }); */

    this.regl = reglInit({
      gl,
      extensions: ['oes_texture_half_float'],
    });
    reglDefer.setRegl(this.regl);
    rregl.setRegl(this.regl);

    this.regl.on('lost', () => {
      console.log('Regl context lost');
    })

    this.regl.on('restore', () => {
      console.log('Regl context restore');
    })

    this.regl.clear(skyClear);

    this.regl.drawLine = this.regl({
      vert: flatVert,
      frag: flatFrag,
      primitive: 'line',
      count: 2,
      attributes: {
        position: this.regl.prop('positions'),
      },
      uniforms: {
        color: this.regl.prop('color'),
        model: mat4.create(),
      },
    })

    this.regl.drawTris = this.regl({
      vert: flatVert,
      frag: flatFrag,
      elements: this.regl.prop('cells'),
      depth: true,
      cull: false,
      attributes: {
        position: this.regl.prop('positions'),
      },
      uniforms: {
        color: [0, 0, 0, 1],
        model: mat4.identity([
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0
        ]),
      },
      blend: {
        enable: true,
        func: {
          src: 'dst color',
          dst: 'src color'
        },
      }
    });


    this.camera = new Camera(this, width, height);
    this.light = new Light(this.camera);

    this.regl.toFrameBuffer = this.regl({
      framebuffer: this.regl.prop('framebuffer')
    });

    this.regl.shadowBuffer = this.regl.framebuffer({
      color: this.regl.texture({
        width: SHADOW_RES,
        height: SHADOW_RES,
        wrap: 'clamp',
        type: 'half float'
      }),
      depth: true
    });

    this.regl.withShadowMap = this.regl({
      uniforms: {
        shadowMap: this.regl.shadowBuffer,
      }
    });

    this.regl.debugCameraBuffer = this.regl.framebuffer({
      color: this.regl.texture({
        width: SHADOW_RES,
        height: SHADOW_RES,
        wrap: 'clamp',
        type: 'half float'
      }),
      depth: true
    });
  }

  drawInShadowBuffer() {
    this.regl.clear({
      color: [0, 0, 0, 255],
      depth: 1
    });
    ShadowGround();
    ShadowFlat(
      Object.values(this.rootStore.entityStore.entityIndex)
        .filter((e: IAssetDependant & { collider?: boolean }) => !e.assetFiles && !e.collider)
    )
    ShadowStaticAOMesh(this.staticAORenderPayload);
  }

  withShadowMapContext() {
    this.regl.clear(skyClear);
    //TODO needs to be DrawShadedFlat();
    ShadedFlat(this.flatRenderPayload);
    AOVoxMesh(this.staticAORenderPayload);

    if (this.rootStore.debug.network) {
      ghostBlend({}, () => {
        AOVoxMesh(this.replicaRenderNodes)
      });
    }

    Ground();
  }

  cameraContext() {
    //Render the shadow map to a frame buffer
    this.regl.toFrameBuffer({
      framebuffer: this.regl.shadowBuffer
    }, this.drawInShadowBuffer.bind(this));

    this.regl.withShadowMap(this.withShadowMapContext.bind(this));

    PlayerName(this.userNames);

    //
    //
    //
    // Debugging stuff below
    if (!this.rootStore.debug.render) return;

    //World origin axis
    AxisHelper({ scale: 100, origin: [0, 0, 0], rotation: [0, 0, 0, 1] });

    // Draw entity axis helpers

    let entAxis: any[] = [];
    let entHulls: any[] = [];
    let entActors: any[] = [];
    let colliders: any[] = [];
    Object.values(this.rootStore.entityStore.entityIndex)
      .forEach((entity) => {
        entAxis.push({
          scale: 100,
          rotation: mat4.getRotation(vec4.create(), entity.model),
          origin: mat4.getTranslation(vec3.create(), entity.model)
        });

        if (entity.hull) {
          entHulls.push({
            ...entity.hull,
            color: [0, 0.7, 0.4, 1],
            model: entity.model,
          });
        }

        if (entity.worldAABB) {
          entActors.push(entity.aabbRenderPayload)
        }

        if (entity.collider) {
          colliders.push(entity);
        }
      });

    AxisHelper(entAxis);

    DrawFlat(colliders);

    // draw collision hulls
    if (this.rootStore.debug.drawHulls) {
      DrawFlat(entHulls);
    }

    // Draw AABB boxes
    DrawActors(entActors);


    // Draw the sweptsphere intersection points
    const { localPlayer } = this.rootStore.entityStore;
    //    this.regl.drawAxisHelper({scale: 100, origin: localPlayer.centerPoint, rotation: [0,0,0,1]]});

    // Draw collision sphere
    DrawActors({
      ...localPlayer.collisionSphere,
      model: mat4.fromRotationTranslation(
        collideSphereOut,
        localPlayer.rotation,
        localPlayer.centerPoint
      ),
      color: [0, 1, 1, 0.8]
    });

    if (this.rootStore.debug.collisions) {
      const colPoints = [
        {
          positions: localPlayer.colPacket.r3IntersectionPoint,
          count: 1,
          color: [1, 0.5, 0.25, 1], // orange thing
        },
        {
          positions: [localPlayer.colPacket.r3NearestNonIntersectPosition],
          count: 1,
          color: [0, 0, 1, 1] // blue
        },
      ];

      const colTri = [...localPlayer.colPacket.collisionTri];
      if (colTri.length) {
        colPoints.push({
          positions: colTri,
          count: colTri.length,
          color: [0, 1, 0, 1], // green
        });
      }

      Point(colPoints);

      if (localPlayer.colPacket.foundCollision) {
        this.regl.drawTris({
          positions: localPlayer.colPacket.collisionTri,
          cells: [[0, 1, 2]],
          color: [1, 1, 1, 1],
          model: mat4.create(),
        });

        const r3Origin = vec3.transformMat3(vec3.create(), localPlayer.colPacket.SlidingPlane.origin, localPlayer.colPacket.iCBM);
        this.regl.drawLine({
          positions: [
            r3Origin,
            vec3.add(
              vec3.create(),
              r3Origin,
              vec3.scale(vec3.create(), localPlayer.colPacket.SlidingPlane.normal, 100)
            )
          ],
          color: [1, 1, 1, 1]
        });

        //      if(localPlayer.colPacket.edge) debugger;
      }


      if (
        this.rootStore.debug.collisions &&
        localPlayer && localPlayer.traceInfo &&
        localPlayer.traceInfo.intersectTri &&
        localPlayer.traceInfo.intersectTri.length
      ) {
        const tri = localPlayer.traceInfo.intersectTri;
        this.regl.drawTris({
          positions: tri,
          cells: [[0, 1, 2]],
          color: [1, 0, 0, 1],
          model: mat4.create(),
        });

        Point([
          {
            positions: tri,
            count: 3,
            color: [0, 0, 1, 1]
          }
        ]);

        const triNorms = tri.map((triVert: vec3) => {
          return {
            positions: [
              triVert,
              vec3.add(vec3.create(), triVert,
                vec3.scale(vec3.create(), localPlayer.traceInfo.intersectTriNorm, 100)
              )
            ],
            color: [0, 0, 0, 1]
          };
        });
        this.regl.drawLine(triNorms)
      }


    }

    if (this.rootStore.debug && this.rootStore.debug.debugCamera) {
      const debugCamera: {
        target: vec3
        eye: vec3
        view: mat4
        perspective: mat4
      } = {
        target: vec3.create(),
        eye: vec3.create(),
        view: mat4.create(),
        perspective: mat4.create()
      };

      debugCamera.target = <vec3>this.camera.frustrumCenterPoint.slice(0);
      debugCamera.eye = <vec3>this.camera.frustrumCenterPoint.slice(0);
      debugCamera.eye[1] += 2000;
      debugCamera.eye[2] += 1;

      debugCamera.view = mat4.lookAt(
        mat4.create(),
        debugCamera.eye,
        debugCamera.target,
        [0, 1, 0]
      );

      debugCamera.perspective = mat4.perspective(
        mat4.create(),
        Math.PI / 4,
        SHADOW_RES / SHADOW_RES,
        0.1,
        2000.0
      );

      const debugLightProjectionOut = mat4.create();
      const frustrumCells = [
        [1, 0, 3],
        [1, 2, 3],

        [4, 5, 7],
        [5, 6, 7],

        [1, 0, 5],
        [4, 0, 5],

        [3, 0, 7],
        [4, 0, 7],

        [6, 2, 7],
        [3, 2, 7],

        [6, 2, 5],
        [1, 2, 5],
      ];

      // // Draw the debug camera to a frame buffer
      this.regl.toFrameBuffer({
        framebuffer: this.regl.debugCameraBuffer
      }, () => {
        /* this.regl.clear({
         *   color: [1,1,1, 1],
         *   depth: 1
         * }); */

        DrawCamera({
          view: debugCamera.view,
          projection: debugCamera.perspective,
          cameraeye: debugCamera.eye,
          lightDir: this.light.lightDir,
          lightView: this.light.view,
          lightProjection: mat4.ortho(
            debugLightProjectionOut,
            -400, // left
            400, // right
            -400, // bottom
            400, // top
            //
            // NOTE
            //
            // If the light projection near/far is shorter than the lightDir distance

            -100, // near
            100, // far
          ),
          shadowRes: SHADOW_RES,
        }, () => {
          // Render the shadow map to a frame buffer
          this.regl.toFrameBuffer({
            framebuffer: this.regl.shadowBuffer
          }, () => {
            this.regl.clear({
              color: [0, 0, 0, 1],
              depth: 1
            });
            ShadowGround();
            ShadowStaticAOMesh(this.staticAORenderPayload);
          });

          this.regl.withShadowMap(() => {
            this.regl.clear({
              color: [1, 1, 1, 1],
              depth: 1
            });

            AOVoxMesh(this.staticAORenderPayload);
            Ground();
          });

          FrustrumVerts({
            positions: this.camera.frustrumVerts,
            elements: frustrumCells,
          });
        });
      });

      // draw a quad with texture that is the debug camera
      TexQuad({
        texture: this.regl.debugCameraBuffer
      });
    }

  }

  render() {
    this.regl.clear(skyClear);

    DrawCamera({
      view: this.camera.viewMatrix,
      projection: this.camera.projectionMatrix,
      cameraeye: this.camera.eye,
      lightDir: this.light.lightDir,
      lightView: this.light.view,
      lightProjection: this.light.projection,
      shadowRes: SHADOW_RES,
    }, this.cameraContext.bind(this));

  }
}
