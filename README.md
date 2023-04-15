# Multi Player Voxel Engine
![alt text](./gameplay.gif "Logo Title Text 1")
This repository contains code to power a multiplayer html5 webgl voxel game engine prototype. This engine was created

## Asset Pipeline
`.vox` files `.qb` files converts to `.aomesh` files

.aomesh is a interleaved binary format. It uses

### Animation
Skeletal animation

## State Managment & Entity Component System (ECS)
The engine uses a custom entity component system powered by mobx.

## Rendering

The engine is setup an agnostic render function. The game state from the ECS is passed to a render function. In the current incarnation the rendering function uses `react-regl` to which is wrapper for `regl`

## Networking
The network is uses WebRTC. The webRTC connection is set to run in unreliable mode the server uses a node.js webrtc implementation and acts as a headless peer. A (https://github.com/mafintosh/signalhub)[Signalhub] server is used to broker the WebRTC handshake.


## Development

npm run dev-client

npm run dev-server
nodemon --inspect build/server.js

npx signalhub listen -p 8080

## Deploy
