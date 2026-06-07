import Layout from "../components/Layout";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DownloadIcon from "@mui/icons-material/Download";

export default function Audit() {
  const [logs, setLogs] = useState([
    {
      id: 1,
      level: "INFO",
      message: "System started",
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      level: "EVENT",
      message: "Document processing service initialized",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isRunning, setIsRunning] = useState(true);
  const logsEndRef = useRef(null);
  const logCountRef = useRef(2);

  // Simulate log generation
  useEffect(() => {
    if (!isRunning) return;

    const logMessages = [
      { level: "INFO", message: "API request received" },
      { level: "EVENT", message: "Document uploaded by user" },
      { level: "EVENT", message: "Document queued for processing" },
      { level: "INFO", message: "Processing started" },
      { level: "INFO", message: "Analyzing document structure" },
      { level: "INFO", message: "Extracting content" },
      { level: "SUCCESS", message: "Document processed successfully" },
      { level: "INFO", message: "SignalR notification sent" },
      { level: "EVENT", message: "Document ready for download" },
      { level: "WARN", message: "High memory usage detected" },
      { level: "ERROR", message: "Failed to connect to service" },
      { level: "INFO", message: "Retrying connection..." },
      { level: "SUCCESS", message: "Connection restored" },
    ];

    const interval = setInterval(
      () => {
        const randomLog =
          logMessages[Math.floor(Math.random() * logMessages.length)];
        logCountRef.current += 1;

        setLogs((prev) => [
          ...prev,
          {
            id: logCountRef.current,
            level: randomLog.level,
            message: randomLog.message,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
      2000 + Math.random() * 3000,
    );

    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLevelColor = (level) => {
    const colors = {
      INFO: {
        bg: "rgba(59, 130, 246, 0.15)",
        border: "#3b82f6",
        color: "#3b82f6",
        icon: "ℹ️",
      },
      EVENT: {
        bg: "rgba(6, 182, 212, 0.15)",
        border: "#06b6d4",
        color: "#06b6d4",
        icon: "📢",
      },
      SUCCESS: {
        bg: "rgba(16, 185, 129, 0.15)",
        border: "#10b981",
        color: "#10b981",
        icon: "✓",
      },
      WARN: {
        bg: "rgba(245, 158, 11, 0.15)",
        border: "#f59e0b",
        color: "#f59e0b",
        icon: "⚠️",
      },
      ERROR: {
        bg: "rgba(239, 68, 68, 0.15)",
        border: "#ef4444",
        color: "#ef4444",
        icon: "✗",
      },
    };
    return colors[level] || colors.INFO;
  };

  const clearLogs = () => {
    setLogs([
      {
        id: 1,
        level: "INFO",
        message: "Logs cleared",
        timestamp: new Date().toISOString(),
      },
    ]);
    logCountRef.current = 1;
  };

  const downloadLogs = () => {
    const logContent = logs
      .map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`)
      .join("\n");

    const blob = new Blob([logContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().getTime()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <Box
        sx={{
          animation: "fadeIn 0.6s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "white",
              mb: 1,
              fontSize: { xs: "24px", md: "32px" },
            }}
          >
            Audit Logs
          </Typography>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "14px",
            }}
          >
            Real-time system activity and event monitoring
          </Typography>
        </Box>

        {/* Controls */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={() => setIsRunning(!isRunning)}
            sx={{
              background: isRunning
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #3b82f6, #06b6d4)",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              transition: "all 0.3s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: isRunning
                  ? "0 8px 24px rgba(245, 158, 11, 0.3)"
                  : "0 8px 24px rgba(59, 130, 246, 0.3)",
              },
            }}
          >
            {isRunning ? "Pause Logging" : "Resume Logging"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadLogs}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              transition: "all 0.3s",
              "&:hover": {
                borderColor: "#3b82f6",
                background: "rgba(59, 130, 246, 0.1)",
              },
            }}
          >
            Download Logs
          </Button>

          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearLogs}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "rgba(255, 255, 255, 0.7)",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              transition: "all 0.3s",
              "&:hover": {
                borderColor: "#ef4444",
                color: "#ef4444",
                background: "rgba(239, 68, 68, 0.1)",
              },
            }}
          >
            Clear Logs
          </Button>

          <Box sx={{ flex: 1 }} />

          <Chip
            label={`${logs.length} entries`}
            variant="outlined"
            sx={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "rgba(255, 255, 255, 0.6)",
              fontWeight: 600,
              fontSize: "12px",
            }}
          />

          <Chip
            label={isRunning ? "🟢 Live" : "⏸ Paused"}
            variant="filled"
            sx={{
              background: isRunning
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(245, 158, 11, 0.2)",
              color: isRunning ? "#10b981" : "#f59e0b",
              fontWeight: 600,
              fontSize: "12px",
              border: `1px solid ${isRunning ? "#10b981" : "#f59e0b"}`,
            }}
          />
        </Box>

        {/* Logs Container */}
        <Paper
          sx={{
            background:
              "linear-gradient(135deg, rgba(15, 20, 25, 0.9), rgba(26, 31, 46, 0.9))",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: 0,
            height: "calc(100vh - 400px)",
            minHeight: "500px",
            overflow: "auto",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            animation:
              "slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both",
            "@keyframes slideUp": {
              from: { opacity: 0, transform: "translateY(30px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {/* Scroll area */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              padding: 2,
              "& > *": {
                marginBottom: "12px",
              },
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(59, 130, 246, 0.3)",
                borderRadius: "4px",
                "&:hover": {
                  background: "rgba(59, 130, 246, 0.5)",
                },
              },
            }}
          >
            {logs.map((log, index) => {
              const levelConfig = getLevelColor(log.level);
              return (
                <Box
                  key={log.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    padding: "10px 12px",
                    background: levelConfig.bg,
                    border: `1px solid ${levelConfig.border}`,
                    borderRadius: "8px",
                    transition: "all 0.3s",
                    animation: `slideIn 0.3s ease-out ${index * 0.02}s both`,
                    "&:hover": {
                      background: levelConfig.bg.replace("0.15", "0.25"),
                      transform: "translateX(4px)",
                    },
                    "@keyframes slideIn": {
                      from: {
                        opacity: 0,
                        transform: "translateX(-10px)",
                      },
                      to: {
                        opacity: 1,
                        transform: "translateX(0)",
                      },
                    },
                  }}
                >
                  {/* Level indicator */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                  >
                    {levelConfig.icon}
                  </Box>

                  {/* Content */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.4,
                          background: `${levelConfig.color}20`,
                          border: `1px solid ${levelConfig.color}40`,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: levelConfig.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {log.level}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontFamily: "monospace",
                        wordBreak: "break-word",
                      }}
                    >
                      {log.message}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <Box ref={logsEndRef} />
          </Box>

          {/* Footer indicator */}
          {isRunning && (
            <Box
              sx={{
                padding: "8px 16px",
                background: "rgba(59, 130, 246, 0.1)",
                borderTop: "1px solid rgba(59, 130, 246, 0.2)",
                fontSize: "11px",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: "6px",
                  height: "6px",
                  background: "#3b82f6",
                  borderRadius: "50%",
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                  },
                }}
              />
              Logging in progress...
            </Box>
          )}
        </Paper>
      </Box>
    </Layout>
  );
}
