//appbar from material ui

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const LandingPage = () => {

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
      </div>
  )
}

export default LandingPage;