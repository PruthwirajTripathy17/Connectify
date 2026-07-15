import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import "../App.css";

const historyTheme = createTheme({
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

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        // Sort history by date descending
        const sortedHistory = (history || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setMeetings(sortedHistory);
      } catch (err) {
        console.log(err);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dataString) => {
    const date = new Date(dataString);
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbarMessage(`Copied code: ${code}`);
    setSnackbarOpen(true);
  };

  return (
    <ThemeProvider theme={historyTheme}>
      <CssBaseline />
      <div className="history-container">
        <div className="history-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <IconButton 
              onClick={() => routeTo("/home")}
              sx={{ 
                color: "text.primary", 
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-light)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)" }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <h1>Meeting History</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#989a9c" }}>
            <span>Total Meetings: {meetings.length}</span>
          </div>
        </div>

        <div className="history-grid">
          {meetings.length !== 0 ? (
            meetings.map((e, i) => {
              return (
                <div key={i} className="history-card">
                  <div className="history-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <VideoCallIcon style={{ color: "#0e71eb" }} />
                      <span className="history-code-badge">{e.mettingCode}</span>
                    </div>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyCode(e.mettingCode)}
                      title="Copy meeting code"
                      sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </div>
                  
                  <div className="history-date">
                    {formatDate(e.date)}
                  </div>

                  <div className="history-card-actions">
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      onClick={() => routeTo(`/${e.mettingCode}`)}
                      sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
                    >
                      Rejoin Meeting
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-history">
              <h3>No Meeting History Yet</h3>
              <p style={{ marginTop: "8px", fontSize: "0.95rem" }}>Meetings you create or join will appear here.</p>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => routeTo("/home")}
                sx={{ mt: 3, textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2000}
          message={snackbarMessage}
          onClose={() => setSnackbarOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}
