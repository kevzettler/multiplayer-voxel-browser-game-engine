# Add your container repo url here
FROM # Add your container repo url here
ARG SIGNALHUB_HOST
ENV SIGNALHUB_HOST=$SIGNALHUB_HOST
ARG SOCKETIO_HOST
ENV SOCKETIO_HOST=$SOCKETIO_HOST
RUN yarn server:build
