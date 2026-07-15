import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TextField, Button, IconButton, Badge, createTheme, ThemeProvider, CssBaseline, Snackbar } from "@mui/material";
import io from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import VideoCallIcon from "@mui/icons-material/VideoCall";

import styles from "../styles/videoComponent.module.css";
import server from "../environment";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0e71eb', /* Zoom Royal Blue */
    },
    background: {
      default: '#16191c', /* Graphite Charcoal */
      paper: '#23282d', /* Card Graphite */
    },
    text: {
      primary: '#f5f5f6',
      secondary: '#989a9c',
    }
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
});

const server_url = `${server}`;
var connections = {};
const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export default function VideoMeetComponent() {
  const { url } = useParams();
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(); // Acting as local video enable/disable boolean
  let [audio, setAudio] = useState();
  let [screen, setscreen] = useState();
  let [showModal, setShowModal] = useState(false); // Default to chat closed
  let [snackbarOpen, setSnackbarOpen] = useState(false);
  let [snackbarMessage, setSnackbarMessage] = useState("");


  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0); // Default to 0 new messages
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]); // Remote videos array

  // Track remote peer usernames (socket.id -> display name)
  let [peerUsernames, setPeerUsernames] = useState({});

  // Helpers for black screen / silence fallback
  let silence = () => {
    let AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    let ctx = new AudioContextClass();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let blackSilence = (...args) => {
    const videoTrack = black(...args);
    const audioTrack = silence();
    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);
    return new MediaStream(tracks);
  };

  // Callback ref to re-bind source streams automatically when element mounts/remounts
  const setLocalVideoRef = useCallback((element) => {
    localVideoRef.current = element;
    if (element && window.localStream) {
      if (element.srcObject !== window.localStream) {
        element.srcObject = window.localStream;
      }
    }
  }, []);

  const getPermissions = async () => {
    try {
      let videoAvail = false;
      let audioAvail = false;
      let stream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoAvail = true;
        audioAvail = true;
      } catch (e) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          audioAvail = true;
        } catch (err) {
          console.log("No media permissions", err);
        }
      }

      setVideoAvailable(videoAvail);
      setAudioAvailable(audioAvail);



      if (stream) {
        window.localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((err) => console.log(err));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          window.localStream = blackSilence();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
          }

          for (let id in connections) {
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((err) => console.log(err));
            });
          }
        }),
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
          .getUserMedia({
            video: video,
            audio: audio,
          })
          .then(getUserMediaSuccess)
          .catch((err) => console.log(err));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  // getPermissions gets called on mount to fetch camera/mic availability



  useEffect(() => {
    getPermissions();
    return () => {
      // Disconnect socket connection on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Close all active WebRTC peer connections on unmount
      for (let id in connections) {
        if (connections[id]) {
          connections[id].close();
        }
      }
      connections = {};

      // Stop local media tracks
      if (window.localStream) {
        try {
          window.localStream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.log(e);
        }
        window.localStream = null;
      }
    };
  }, []);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (!connections[fromId]) {
        initializePeerConnection(fromId);
      }

      // Read peer display names and save in state dictionary
      if (signal.username) {
        setPeerUsernames((prev) => {
          if (prev[fromId] === signal.username) return prev;
          return { ...prev, [fromId]: signal.username };
        });
      }

      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((err) => console.log(err));
                })
                .catch((err) => console.log(err));
            }
          })
          .catch((err) => console.log(err));
      }
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((err) => console.log(err));
      }
    }
  };

  let initializePeerConnection = (socketListId) => {
    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

    connections[socketListId].onicecandidate = (event) => {
      if (event.candidate !== null) {
        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({ ice: event.candidate }),
        );
      }
    };

    connections[socketListId].onaddstream = (event) => {
      let videoExists = videoRef.current.find(
        (video) => video.socketId === socketListId,
      );
      if (videoExists) {
        setVideos((videos) => {
          const updatedVideos = videos.map((video) =>
            video.socketId === socketListId
              ? { ...video, stream: event.stream }
              : video,
          );
          videoRef.current = updatedVideos;
          return updatedVideos;
        });
      } else {
        let newVideo = {
          socketId: socketListId,
          stream: event.stream,
          autoPlay: true,
          playsInline: true,
        };
        setVideos((videos) => {
          const updatedVideos = [...videos, newVideo];
          videoRef.current = updatedVideos;
          return updatedVideos;
        });
      }
    };

    if (window.localStream !== undefined && window.localStream !== null) {
      connections[socketListId].addStream(window.localStream);
    } else {
      window.localStream = blackSilence();
      connections[socketListId].addStream(window.localStream);
    }

    // Immediately push our display name to the newly initialized peer connection
    socketRef.current.emit(
      "signal",
      socketListId,
      JSON.stringify({ username: username })
    );
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => {
          const updatedVideos = videos.filter((video) => video.socketId !== id);
          videoRef.current = updatedVideos;
          return updatedVideos;
        });
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }
        // Remove left user from peer names dictionary
        setPeerUsernames((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      });
      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;
          if (!connections[socketListId]) {
            initializePeerConnection(socketListId);
          }
        });
        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}
            connections[id2]
              .createOffer()
              .then((description) => {
                connections[id2].setLocalDescription(description).then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({
                      sdp: connections[id2].localDescription,
                    }),
                  );
                });
              })
              .catch((e) => console.log(e));
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    setscreen(false);
    connectToSocketServer();
  };

  let routeTo = useNavigate();
  let connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);
    getMedia();
    localStorage.setItem("activeCall", url);
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connections[id].localDescription,
              }),
            );
          })
          .catch((e) => {
            console.log(e);
          });
      });
    }
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setscreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          window.localStream = blackSilence();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
          }

          getUserMedia();
        }),
    );
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: true,
          })
          .then(getDisplayMediaSuccess)
          .catch((e) => {
            console.log(e);
            setscreen(false);
            setSnackbarMessage("Screen sharing cancelled or failed");
            setSnackbarOpen(true);
          });
      } else {
        setscreen(false);
        setSnackbarMessage("Screen sharing is not supported on mobile devices or this browser.");
        setSnackbarOpen(true);
      }
    } else {
      if (window.localStream) {
        try {
          window.localStream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.log(e);
        }
      }
      getUserMedia();
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setscreen(!screen);
  };

  let sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}

    // Disconnect socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Close all WebRTC peer connections
    for (let id in connections) {
      if (connections[id]) {
        connections[id].close();
      }
    }
    connections = {};

    localStorage.removeItem("activeCall");
    routeTo("/home");
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div style={{ height: "100vh", backgroundColor: "#16191c" }}>
        {askForUsername === true ? (
          /* Lobby Card Setup */
          <div className={styles.lobbyContainer}>
            <div className={styles.lobbyCard}>
              <div className={styles.lobbyLeft}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <VideoCallIcon style={{ color: "#0e71eb", fontSize: "2.5rem" }} />
                  <h1 style={{ margin: 0, fontSize: "1.8rem", letterSpacing: "-0.5px", textAlign: "center" }}>Join Meeting Lobby</h1>
                </div>
                <p style={{ color: "#989a9c", lineHeight: 1.5, margin: 0 }}>
                  Verify your screen and audio settings before joining the call. Enter your display name to connect.
                </p>

                {/* Meeting Code Badge Display */}
                <div className={styles.lobbyCodeBadge}>
                  <span>Meeting Room Code:</span>
                  <strong>{url}</strong>
                </div>
                
                <TextField
                  fullWidth
                  id="outlined-basic"
                  label="Display Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  variant="outlined"
                  sx={{
                    mt: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    }
                  }}
                />
                
                <Button 
                  fullWidth
                  disabled={!username.trim()}
                  variant="contained" 
                  onClick={connect}
                  sx={{
                    py: 1.5,
                    borderRadius: "12px",
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "1rem",
                    boxShadow: "0 4px 15px rgba(14, 113, 235, 0.25)"
                  }}
                >
                  Join Meeting
                </Button>
              </div>

              <div className={styles.lobbyRight}>
                <div className={styles.lobbyVideoPreviewContainer}>
                  {videoAvailable ? (
                    <video className={styles.lobbyVideoPreview} ref={setLocalVideoRef} autoPlay muted></video>
                  ) : (
                    <div className={styles.lobbyVideoPlaceholder}>
                      <VideocamOffIcon />
                      <span>Camera is muted</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <IconButton 
                    onClick={() => setVideoAvailable(!videoAvailable)}
                    sx={{
                      bgcolor: videoAvailable ? "rgba(255,255,255,0.03)" : "rgba(255,59,48,0.15)",
                      color: videoAvailable ? "white" : "#ff3b30",
                      '&:hover': { bgcolor: videoAvailable ? "rgba(255,255,255,0.08)" : "rgba(255,59,48,0.25)" }
                    }}
                  >
                    {videoAvailable ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                  <IconButton 
                    onClick={() => setAudioAvailable(!audioAvailable)}
                    sx={{
                      bgcolor: audioAvailable ? "rgba(255,255,255,0.03)" : "rgba(255,59,48,0.15)",
                      color: audioAvailable ? "white" : "#ff3b30",
                      '&:hover': { bgcolor: audioAvailable ? "rgba(255,255,255,0.08)" : "rgba(255,59,48,0.25)" }
                    }}
                  >
                    {audioAvailable ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* WebRTC Immersive Video Conference */
          <div className={styles.meetVideoContainer}>
            <div className={styles.videoGridSection}>
              {/* Floating mirror view for local user when other videos are present */}
              {videos.length > 0 && (
                <video
                  className={styles.meetUserVideo}
                  ref={setLocalVideoRef}
                  autoPlay
                  muted
                ></video>
              )}

              {/* Dynamic Scaling Conference View */}
              <div 
                className={styles.conferenceView} 
                data-count={videos.length > 0 ? videos.length : 1}
              >
                {videos.length === 0 ? (
                  /* Local screen in center if alone */
                  <div className={styles.videoCard}>
                    <video ref={setLocalVideoRef} autoPlay muted style={{ transform: "scaleX(-1)" }}></video>
                    <div className={styles.nameTag}>{username} (You)</div>
                  </div>
                ) : (
                  videos.map((video) => (
                    <div key={video.socketId} className={styles.videoCard}>
                      <video
                        data-socket={video.socketId}
                        ref={(ref) => {
                          if (ref && video.stream) {
                            if (ref.srcObject !== video.stream) {
                              ref.srcObject = video.stream;
                            }
                          }
                        }}
                        autoPlay
                      ></video>
                      {/* Displays the resolved display name propagated over WebRTC signal channels */}
                      <div className={styles.nameTag}>
                        {peerUsernames[video.socketId] || `Participant (${video.socketId.substring(0, 5)})`}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Control Dock Panel */}
              <div className={styles.buttonContainers}>
                <IconButton 
                  onClick={handleAudio} 
                  sx={{ 
                    color: audio === true ? "white" : "#ff3b30",
                    bgcolor: audio === true ? "rgba(255,255,255,0.03)" : "rgba(255,59,48,0.15)",
                    "&:hover": { bgcolor: audio === true ? "rgba(255,255,255,0.08)" : "rgba(255,59,48,0.25)" }
                  }}
                >
                  {audio === true ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
                
                <IconButton 
                  onClick={handleVideo} 
                  sx={{ 
                    color: video === true ? "white" : "#ff3b30",
                    bgcolor: video === true ? "rgba(255,255,255,0.03)" : "rgba(255,59,48,0.15)",
                    "&:hover": { bgcolor: video === true ? "rgba(255,255,255,0.08)" : "rgba(255,59,48,0.25)" }
                  }}
                >
                  {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>

                <IconButton 
                  onClick={handleScreen} 
                  sx={{ 
                    color: screen === true ? "#0e71eb" : "white",
                    bgcolor: screen === true ? "rgba(14,113,235,0.15)" : "rgba(255,255,255,0.03)",
                    "&:hover": { bgcolor: screen === true ? "rgba(14,113,235,0.25)" : "rgba(255,255,255,0.08)" }
                  }}
                >
                  {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>

                <Badge badgeContent={newMessages} color="primary">
                  <IconButton 
                    onClick={() => {
                      setShowModal(!showModal);
                      setNewMessages(0);
                    }} 
                    sx={{ 
                      color: showModal ? "#0e71eb" : "white",
                      bgcolor: showModal ? "rgba(14,113,235,0.15)" : "rgba(255,255,255,0.03)",
                      "&:hover": { bgcolor: showModal ? "rgba(14,113,235,0.25)" : "rgba(255,255,255,0.08)" }
                    }}
                  >
                    <ChatIcon />
                  </IconButton>
                </Badge>

                <IconButton 
                  onClick={handleEndCall} 
                  className={styles.endCallButton}
                  sx={{ 
                    color: "white !important", 
                    bgcolor: "#ff3b30 !important",
                    "&:hover": { bgcolor: "#e02d24 !important", transform: "scale(1.08)" }
                  }}
                >
                  <CallEndIcon />
                </IconButton>
              </div>
            </div>

            {/* Sliding Sidebar Chat Panel */}
            {showModal && (
              <div className={styles.chatRoom}>
                <div className={styles.chatContainer}>
                  <div className={styles.chatHeader}>
                    <h2>Meeting Chat</h2>
                    <IconButton size="small" onClick={() => setShowModal(false)} sx={{ color: "text.secondary" }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>

                  <div className={styles.chattingDisplay}>
                    {messages.length > 0 ? (
                      messages.map((item, index) => {
                        const isMine = item.sender === username;
                        return (
                          <div 
                            key={index} 
                            className={isMine ? styles.messageBubbleMine : styles.messageBubble}
                          >
                            <p className={isMine ? styles.messageSenderMine : styles.messageSender}>
                              {isMine ? "You" : item.sender}
                            </p>
                            <p className={styles.messageText}>{item.data}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: "center", color: "#989a9c", marginTop: "2rem", fontSize: "0.9rem" }}>
                        No messages yet in this meeting.
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.chattingArea}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Send a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          sendMessage();
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        }
                      }}
                    />
                    <IconButton 
                      color="primary" 
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      sx={{ 
                        bgcolor: "rgba(14,113,235,0.1)",
                        "&:hover": { bgcolor: "rgba(14,113,235,0.2)" }
                      }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          message={snackbarMessage}
          onClose={() => setSnackbarOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}
