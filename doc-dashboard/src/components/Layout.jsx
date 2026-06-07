import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import UploadFileIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 280;

const menuItems = [
  { path: "/", label: "Dashboard", icon: DashboardIcon },
  { path: "/upload", label: "Upload", icon: UploadFileIcon },
  { path: "/documents", label: "Documents", icon: DescriptionIcon },
  { path: "/audit", label: "Audit Logs", icon: ListAltIcon },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background gradient */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(600px at 50% -50%, rgba(59, 130, 246, 0.1), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              color: "white",
              fontSize: "18px",
            }}
          >
            📄
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "16px",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                margin: 0,
              }}
            >
              DocFlow
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                color: "rgba(255, 255, 255, 0.5)",
                fontWeight: 500,
                margin: 0,
              }}
            >
              v1.0
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <List
        sx={{
          flex: 1,
          pt: 2,
          px: 1.5,
          position: "relative",
          zIndex: 1,
          "& .MuiListItemButton-root": {
            borderRadius: "12px",
            mb: 1,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            color: "rgba(255, 255, 255, 0.7)",
            "&:hover": {
              background: "rgba(59, 130, 246, 0.15)",
              color: "#fff",
              transform: "translateX(6px)",
            },
            "&.active": {
              background:
                "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))",
              color: "#fff",
              "& .MuiListItemIcon-root": {
                color: "#3b82f6",
              },
            },
          },
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              className={isActive ? "active" : ""}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive ? "#3b82f6" : "rgba(255, 255, 255, 0.5)",
                  transition: "color 0.3s",
                }}
              >
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  "& .MuiTypography-root": {
                    fontSize: "14px",
                    fontWeight: 500,
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#10b981",
                boxShadow: "0 0 0 2px #0f1419",
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              }}
            >
              U
            </Avatar>
          </Badge>
          <Box>
            <Typography
              sx={{ fontSize: "13px", fontWeight: 600, color: "white" }}
            >
              User
            </Typography>
            <Typography
              sx={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}
            >
              Online
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#0a0e14" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1200,
          background:
            "linear-gradient(135deg, rgba(15, 20, 25, 0.95), rgba(26, 31, 46, 0.95))",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "16px", md: "18px" },
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Doc Processing System
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Settings">
              <IconButton
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  transition: "all 0.3s",
                  "&:hover": {
                    color: "#3b82f6",
                    background: "rgba(59, 130, 246, 0.1)",
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            border: "none",
          },
          display: { xs: "none", md: "block" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: "auto",
          background: "linear-gradient(135deg, #0a0e14 0%, #0f1419 100%)",
          minHeight: "100vh",
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: "1600px",
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
