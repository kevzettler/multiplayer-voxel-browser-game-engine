FROM your image repo here as game-base
ARG SIGNALHUB_HOST
ENV SIGNALHUB_HOST=$SIGNALHUB_HOST
ARG SOCKETIO_HOST
ENV SOCKETIO_HOST=$SOCKETIO_HOST
ARG ASSET_HOST
ENV ASSET_HOST=$ASSET_HOST
ENV PUBLIC_URL=/
RUN yarn client:build

FROM nginx
COPY --from=game-base ./build/assets /usr/share/nginx/html/assets
COPY --from=game-base ./build/static /usr/share/nginx/html/static
COPY --from=game-base ./build/index.html /usr/share/nginx/html
COPY --from=game-base ./build/asset-manifest.json /usr/share/nginx/html
COPY --from=game-base ./build/manifest.json /usr/share/nginx/html
COPY --from=game-base ./build/service-worker.js /usr/share/nginx/html
COPY --from=game-base ./build/favicon.ico /usr/share/nginx/html
COPY --from=game-base ./build/simplepeer.min.js /usr/share/nginx/html
