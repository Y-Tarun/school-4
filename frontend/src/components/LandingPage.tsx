import { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import httpClient from "../utility/httpClient";

interface HelloResponse {
  message: string;
}

const LandingPage = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await httpClient.get<HelloResponse>("/hello");
        setMessage(data.message);
      } catch (error) {
        console.error("API Error:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Balvatika
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button component={Link} to="/" sx={{ color: '#fff' }}>
              Home
            </Button>
            <Button component={Link} to="/dashboard" sx={{ color: '#fff' }}>
              Dashboard
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <h1>Landing page </h1>
      <p>{message || "Loading..."}</p>
    </div>
  );
};

export default LandingPage;