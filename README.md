# Multiplayer voxel browser game engine
![alt text](./gameplay.gif "Logo Title Text 1")
This repository contains code for a prototype multiplayer voxel browser game engine. The following README is a look at the technical design and architecture of the engine. For more information on the history and motivation of this project checkout the blog post

## Asset Pipeline
The whole asset pipeline is built around the [aomesher](https://github.com/mikolalysenko/ao-mesher) and the complementary ao-shader. Voxels are stored in 3-Dimensional 32bit integer array [ndarrays](https://github.com/scijs/ndarray) The ndarrays are created in in x,y,z dimensions that match the source voxel files. The voxel color palette data is then stored within the ndarray as a 32bit integer.

The asset pipeline parses `.vox` and `.qb` format voxel models and converts to a custom `.aomesh` format. `.vox` models are used for static environment models. `.qb` models are used for segmented character models that are later bound to skeletal animation The `.qb` files store a cobination of joint + color values `.aomesh` format is an interleaved binary vertex format that captures follows the [aomesher vertex format](https://github.com/mikolalysenko/ao-mesher/blob/master/mesh.js#L21)

> x, y, z, ambient occlusion, normal_x, normal_y, normal_z, tex_id

The `.aomesh` models can output processed with `npm run build-meshes`

### Animation
The animation system uses [Skeletal animation system](https://github.com/chinedufn/skeletal-animation-system) The skeletal animations are baked in a blender file then the animations are exported to json using [landon](https://docs.rs/landon/latest/landon/)

The animations are linked to `.qb` files at build time in the [`QBToAOVerts.js`](./scripts/QBToAOVerts.js#L65) script.

## Rendering
The engine has a stateless rendering function influenced by react. The game state from the ECS is passed to a render function. In the current incarnation the rendering function uses `react-regl` to which is wrapper for [regl](https://github.com/regl-project/regl/).

## Game State & Entity Component System (ECS)
The ECS is not a pure ECS with strict flat buffer memory arrangment.  The engine uses a custom entity component system powered by [mobx](https://mobx.js.org/README.html). It's more of a mixin system. Entities are classes composed of mixins each mixin has its own related state.

### Physics and Collision

* Broad phase
collision uses AABB

* Narrow phase
uses sphere-ellipsoid collison

## Networking
The networking code uses WebRTC. The WebRTC connection is set to run in unreliable mode which supposedly removes some overhead reliability checks and is equivilent to running in UDP instead of TCP. The server uses a node.js webrtc implementation and acts as a headless peer. A [Signalhub](https://github.com/mafintosh/signalhub) server is used to broker the WebRTC handshake.


## Development Workflow

npm run dev-client

npm run dev-server
nodemon --inspect build/server.js

npx signalhub listen -p 8080

## Deployment workflow
