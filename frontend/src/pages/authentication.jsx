import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import VideoCallIcon from '@mui/icons-material/VideoCall';

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

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleLogin, handleRegister } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        const result = await handleRegister(name, username, password);
        setMessage(result);
        setOpen(true);
        setName("");
        setUsername("");
        setPassword("");
        setError("");
        setFormState(0);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Something went wrong";
      setError(message);
    }
  };

  const images = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
  ];

  const [backgroundImage] = React.useState(() => {
    return images[Math.floor(Math.random() * images.length)];
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <Box
        sx={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          backgroundColor: "background.default",
        }}
      >
        {/* Left Side Cover Image */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            flex: 7,
            backgroundImage: `linear-gradient(to right, rgba(22, 25, 28, 0.4), #16191c), url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Right Side Form Panel */}
        <Paper
          elevation={0}
          square
          sx={{
            flex: { xs: 12, md: 5, lg: 3.5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: 3, sm: 6 },
            backgroundColor: "background.paper",
            borderLeft: "1px solid var(--border-light)",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 360 }}>
            {/* Header Brand Logo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4, justifyContent: "center" }}>
              <VideoCallIcon sx={{ color: "primary.main", fontSize: "2.5rem" }} />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                Connectify
              </Typography>
            </Box>

            {/* Switch Tabs */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, bgcolor: "rgba(255,255,255,0.01)", p: 0.5, borderRadius: 2, border: "1px solid var(--border-light)" }}>
              <Button
                fullWidth
                variant={formState === 0 ? "contained" : "text"}
                onClick={() => {
                  setFormState(0);
                  setError("");
                }}
                sx={{
                  py: 1,
                  borderRadius: 1.5,
                  fontWeight: 600,
                  boxShadow: formState === 0 ? "0 4px 12px rgba(14, 113, 235, 0.2)" : "none"
                }}
              >
                Sign In
              </Button>
              <Button
                fullWidth
                variant={formState === 1 ? "contained" : "text"}
                onClick={() => {
                  setFormState(1);
                  setError("");
                }}
                sx={{
                  py: 1,
                  borderRadius: 1.5,
                  fontWeight: 600,
                  boxShadow: formState === 1 ? "0 4px 12px rgba(14, 113, 235, 0.2)" : "none"
                }}
              >
                Sign Up
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: "center" }}>
              {formState === 0 ? "Welcome back! Please enter your details." : "Join us to experience seamless calling."}
            </Typography>

            {/* Registration Name Field */}
            {formState === 1 && (
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 1 }}
              />
            )}

            {/* Username Field */}
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 1 }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              margin="normal"
              type="password"
              label="Password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Error Message */}
            {error && (
              <Box
                sx={{
                  color: "#ff3b30",
                  mt: 1,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  bgcolor: "rgba(255, 59, 48, 0.1)",
                  p: 1.5,
                  borderRadius: 1.5,
                  border: "1px solid rgba(255, 59, 48, 0.2)"
                }}
              >
                {error}
              </Box>
            )}

            {/* Action Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "0 4px 14px rgba(14, 113, 235, 0.25)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 6px 18px rgba(14, 113, 235, 0.4)",
                  transform: "translateY(-1px)"
                }
              }}
              onClick={handleAuth}
            >
              {formState === 0 ? "Sign In" : "Create Account"}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </ThemeProvider>
  );
}
