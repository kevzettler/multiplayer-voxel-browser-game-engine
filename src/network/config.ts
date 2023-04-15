import * as createHmac from 'create-hmac';

console.log("ENV", process.env);
const SIGNALHUB_HOST = process.env.SIGNALHUB_HOST
const SIGNALHUB_PORT = process.env.SIGNALHUB_PORT
const SIGNALHUB_PROTOCOL = process.env.SIGNALHUB_PROTOCOL || 'http';
const SIGNALHUB_URL = `${SIGNALHUB_PROTOCOL}://${SIGNALHUB_HOST}:${SIGNALHUB_PORT}`;
console.log('SIGNALHUB_URL: ', SIGNALHUB_URL);

const SOCKETIO_HOST = process.env.SOCKETIO_HOST || 'localhost';
const SOCKETIO_PORT = process.env.SOCKETIO_PORT || 4000;
const SOCKETIO_URL = `http://${SOCKETIO_HOST}:${SOCKETIO_PORT}`;
console.log('SOCKETIO_URL: ', SOCKETIO_URL);

const TURNSERVER_HOST = process.env.TURNSERVER_HOST || '127.0.0.1';
const TURNSERVER_PORT = process.env.TURNSERVER_PORT || 3478;
const TURNSERVER_URL = `${TURNSERVER_HOST}:${TURNSERVER_PORT}`;
console.log("TURNSERVER_URL", TURNSERVER_URL);

//generate turnserver creds in JS
var secret = 'mysecret'; //TODO get this from server or something
var time = Math.floor(new Date().getTime() / 1000);
var expiry = 99999999999; //LOLOL
var username = (time + expiry).toString();
var credential = createHmac('sha1', secret).update(username).digest('base64');

export default {
  signalHub: {
    url: SIGNALHUB_URL
  },

  socketIO: {
    url: SOCKETIO_URL,
    port: SOCKETIO_PORT,
    host: SOCKETIO_HOST
  },

  simplePeer: {
    initiator: true,
    trickle: true,
    channelConfig: {
      ordered: false,
      maxRetransmits: 0
    },

    config: {
      iceServers: [
        { urls: `stun:${TURNSERVER_URL}` },
        {
          urls: `turn:${TURNSERVER_URL}`,
          username,
          credential
        }
      ]
    }
  }
};
