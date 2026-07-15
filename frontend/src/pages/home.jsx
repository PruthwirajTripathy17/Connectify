import React, { useState, useContext, useEffect } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { IconButton, Button, TextField, ThemeProvider, createTheme, CssBaseline, Typography, Box } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';

const dashboardTheme = createTheme({
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

function HomeComponent() {
    let navigate = useNavigate();
    const { addToUserHistory } = useContext(AuthContext);

    // Time States
    const [time, setTime] = useState(new Date());
    const [activeCall, setActiveCall] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const storedCall = localStorage.getItem("activeCall");
        if (storedCall) {
            setActiveCall(storedCall);
        }
    }, []);

    const handleDismissActiveCall = () => {
        localStorage.removeItem("activeCall");
        setActiveCall(null);
    };

    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateString = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Modals state
    const [meetingCode, setMeetingCode] = useState('');
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Dynamic User Schedule
    const [meetingsList, setMeetingsList] = useState([
        { id: "product-alignment", title: "Product Alignment Sync", time: "10:30 AM - 11:00 AM" },
        { id: "connectify-demo", title: "Connectify Feedback Review", time: "3:30 PM - 4:00 PM" }
    ]);

    let handleJoinVideoCall = async (codeToJoin = meetingCode) => {
        const cleanCode = codeToJoin.trim();
        if (!cleanCode) return;
        await addToUserHistory(cleanCode);
        navigate(`/${cleanCode}`);
    }

    let handleCreateNewMeeting = async () => {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        let randCode = "";
        for (let i = 0; i < 9; i++) {
            if (i === 3 || i === 6) randCode += "-";
            randCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await addToUserHistory(randCode);
        navigate(`/${randCode}`);
    }

    const handleCreateSchedule = (e) => {
        e.preventDefault();
        if (!scheduleTitle.trim()) return;
        const newMeeting = {
            id: scheduleTitle.toLowerCase().replace(/\s+/g, '-'),
            title: scheduleTitle,
            time: "Scheduled (Click to Join)"
        };
        setMeetingsList([...meetingsList, newMeeting]);
        setScheduleTitle('');
        setIsScheduleModalOpen(false);
    }

    return (
        <ThemeProvider theme={dashboardTheme}>
            <CssBaseline />
            <div className="dashboard-container">
                {/* Modern Navbar */}
                <div className="navBar">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <VideoCallIcon style={{ color: "#0e71eb", fontSize: "2.2rem" }} />
                        <h2 style={{ fontSize: "1.5rem" }}>Connectify</h2>
                    </div>
                    <div className="navBar-actions">
                        <div className="navBar-history-btn" onClick={() => navigate("/history")}>
                            <RestoreIcon fontSize="small" />
                            <span style={{ fontWeight: 600 }}>History Logs</span>
                        </div>
                        <Button 
                            variant="outlined" 
                            color="error"
                            size="small"
                            startIcon={<LogoutIcon />}
                            onClick={() => {
                                localStorage.removeItem("token");
                                navigate("/auth");
                            }}
                            sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600, py: 0.8 }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Active Rejoin Call Notification Banner */}
                {activeCall && (
                    <div className="active-call-banner">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <VideoCallIcon style={{ color: "#30b058", fontSize: "1.8rem" }} />
                            <span style={{ fontSize: "0.95rem" }}>
                                You left meeting <strong>{activeCall}</strong> without ending the call.
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Button 
                                size="small" 
                                variant="contained" 
                                color="success" 
                                onClick={() => handleJoinVideoCall(activeCall)}
                                sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                            >
                                Reconnect
                            </Button>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                color="inherit" 
                                onClick={handleDismissActiveCall}
                                sx={{ textTransform: "none", borderRadius: "8px", color: "#989a9c" }}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                )}

                {/* Dashboard Main Content (Zoom Desktop client setup) */}
                <div className="meetContainer">
                    
                    {/* Action Cards Grid (Left Section) */}
                    <div className="leftPanel">
                        <div className="zoom-action-grid">
                            
                            {/* Card 1: New Meeting */}
                            <div className="zoom-action-card" onClick={handleCreateNewMeeting}>
                                <div className="zoom-icon-circle zoom-orange">
                                    <VideoCallIcon style={{ fontSize: "2.4rem" }} />
                                </div>
                                <h3>New Meeting</h3>
                                <p>Start an instant meeting</p>
                            </div>

                            {/* Card 2: Join Meeting */}
                            <div className="zoom-action-card" onClick={() => setIsJoinModalOpen(true)}>
                                <div className="zoom-icon-circle zoom-blue">
                                    <AddBoxIcon style={{ fontSize: "2.4rem" }} />
                                </div>
                                <h3>Join Call</h3>
                                <p>Connect via room invite code</p>
                            </div>

                            {/* Card 3: Schedule */}
                            <div className="zoom-action-card" onClick={() => setIsScheduleModalOpen(true)}>
                                <div className="zoom-icon-circle zoom-blue">
                                    <CalendarMonthIcon style={{ fontSize: "2.4rem" }} />
                                </div>
                                <h3>Schedule</h3>
                                <p>Plan your upcoming meetings</p>
                            </div>

                            {/* Card 4: Share Screen */}
                            <div className="zoom-action-card" onClick={() => setIsShareModalOpen(true)}>
                                <div className="zoom-icon-circle zoom-green">
                                    <PresentToAllIcon style={{ fontSize: "2.4rem" }} />
                                </div>
                                <h3>Share Screen</h3>
                                <p>Present your window or tab</p>
                            </div>

                        </div>
                    </div>

                    {/* Clock & Schedule list (Right Section) */}
                    <div className="rightPanel">
                        {/* Clock Widget */}
                        <div className="clock-widget">
                            <div className="clock-time">{timeString}</div>
                            <div className="clock-date">{dateString}</div>
                        </div>

                        {/* Schedule List Panel */}
                        <div className="zoom-schedule-panel">
                            <h4>TODAY'S MEETINGS</h4>
                            <div className="zoom-schedule-list">
                                {meetingsList.length > 0 ? (
                                    meetingsList.map((meet, idx) => (
                                        <div 
                                            key={idx} 
                                            className="zoom-schedule-item"
                                            onClick={() => handleJoinVideoCall(meet.id)}
                                            title="Click to start/join meeting"
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="zoom-schedule-left">
                                                <span className="zoom-schedule-time">{meet.time}</span>
                                                <span className="zoom-schedule-title">{meet.title}</span>
                                                <span className="zoom-schedule-id">Room: {meet.id}</span>
                                            </div>
                                            <IconButton size="small" color="primary">
                                                <ArrowForwardIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    ))
                                ) : (
                                    <div className="zoom-schedule-empty">
                                        <CalendarMonthIcon />
                                        <p>No upcoming meetings today</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* MODAL: JOIN MEETING */}
                {isJoinModalOpen && (
                    <div className="zoom-modal-backdrop" onClick={() => setIsJoinModalOpen(false)}>
                        <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Join Meeting</Typography>
                                <IconButton size="small" onClick={() => setIsJoinModalOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enter a meeting link or code to join the call.
                            </Typography>
                            <TextField 
                                fullWidth
                                placeholder="Example: abc-def-ghi"
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                InputProps={{
                                    startAdornment: <KeyboardIcon style={{ color: "#989a9c", marginRight: "8px" }} />
                                }}
                                sx={{ mb: 3 }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <Button onClick={() => setIsJoinModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
                                    Cancel
                                </Button>
                                <Button 
                                    variant="contained"
                                    disabled={!meetingCode.trim()}
                                    onClick={() => handleJoinVideoCall()}
                                    sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                                >
                                    Join Room
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: SCHEDULE MEETING */}
                {isScheduleModalOpen && (
                    <div className="zoom-modal-backdrop" onClick={() => setIsScheduleModalOpen(false)}>
                        <form onSubmit={handleCreateSchedule} className="zoom-modal-content" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Schedule Meeting</Typography>
                                <IconButton size="small" onClick={() => setIsScheduleModalOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Give your upcoming schedule a meeting title.
                            </Typography>
                            <TextField 
                                fullWidth
                                placeholder="Example: Marketing Sync"
                                value={scheduleTitle}
                                onChange={e => setScheduleTitle(e.target.value)}
                                sx={{ mb: 3 }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <Button onClick={() => setIsScheduleModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    variant="contained"
                                    disabled={!scheduleTitle.trim()}
                                    sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                                >
                                    Schedule
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODAL: SHARE SCREEN */}
                {isShareModalOpen && (
                    <div className="zoom-modal-backdrop" onClick={() => setIsShareModalOpen(false)}>
                        <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Share Screen</Typography>
                                <IconButton size="small" onClick={() => setIsShareModalOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enter the meeting code of the room you want to share your screen in.
                            </Typography>
                            <TextField 
                                fullWidth
                                placeholder="Enter meeting code"
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                sx={{ mb: 3 }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <Button onClick={() => setIsShareModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
                                    Cancel
                                </Button>
                                <Button 
                                    variant="contained"
                                    disabled={!meetingCode.trim()}
                                    onClick={() => handleJoinVideoCall(meetingCode)}
                                    sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}
                                >
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ThemeProvider>
    )
}

export default withAuth(HomeComponent);