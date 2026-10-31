import { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
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

    const navItems = [
        {label: 'Home', onClick: () => {
        }},
        {label: 'About', onClick: () => {}}, 
        {label: 'Contact', onClick: () => {}}, 
        {label: 'Login', onClick: () => {}}
    ];

  return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">
              Balvatika
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item) => (
              <Button key={item.label} sx={{ color: '#fff' }} onClick={item.onClick}>
                {item.label}
              </Button>
            ))}
          </Box>
          </Toolbar>
        </AppBar>
        <h1>Landing page component</h1>
        <p>{message || "Loading..."}</p>
      </div>
  )
}

export default LandingPage;