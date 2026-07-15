import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import VideoCallIcon from '@mui/icons-material/VideoCall';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader" onClick={() => navigate("/")}>
          <h2>
            <VideoCallIcon style={{ color: "#FF9839", fontSize: "2.2rem" }} />
            Connectify
          </h2>
        </div>
        <div className="navList">
          <p className="nav-link-btn" onClick={() => navigate("/auth")}>Solutions</p>
          <p className="nav-link-btn" onClick={() => navigate("/auth")}>Pricing</p>
          <p className="nav-link-btn" onClick={() => navigate("/auth")}>Resources</p>
          <p className="nav-link-btn" style={{ marginLeft: "1rem" }} onClick={() => navigate("/auth")}>Sign In</p>
          <div className="nav-primary-btn" onClick={() => navigate("/auth")} role="button">
            Sign Up Free
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#FF9839" }}>Connect</span> with your loved ones, anywhere.
          </h1>
          <p className="hero-subtitle">
            Experience premium-quality, lag-free video meetings with secure chat and seamless screen sharing. Keep the distance close with Connectify.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="hero-primary-btn">
              Get Started Free
            </Link>
            <Link to="/auth" className="hero-secondary-btn">
              Join a Meeting
            </Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="Connectify Meetings Mockup" />
        </div>
      </div>
    </div>
  );
}
