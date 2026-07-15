let IS_PROD=false;
const server = IS_PROD ?
"https://connectifybackend-qpd2.onrender.com":
`http://${window.location.hostname}:8000`;

export default server;