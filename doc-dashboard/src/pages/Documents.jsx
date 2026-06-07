import Layout from "../components/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Button,
  Box,
  Typography,
  TablePagination,
  TextField,
  InputAdornment,
  Grid,
  Card,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import api from "../services/api";
import SearchIcon from "@mui/icons-material/Search";
import GetAppIcon from "@mui/icons-material/GetApp";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BoltIcon from "@mui/icons-material/Bolt";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [usingPolling, setUsingPolling] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokensSaved, setTokensSaved] = useState({
    tokensSaved: 0,
    reductionPercent: 0,
    estimatedCostSavedGPT: 0,
    estimatedCostSavedClaude: 0,
  });

  const pollRef = useRef(null);
  const connectionRef = useRef(null);

  // 🔥 Fetch documents
  const fetchDocs = async () => {
    try {
      const res = await api.get("/documents");
      setDocs(res.data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
    }
  };

  // 🔥 Fetch token savings data
  const fetchTokensSaved = async () => {
    try {
      const res = await api.get("/documents/stats/tokens-saved");
      setTokensSaved(
        res.data || {
          tokensSaved: 0,
          reductionPercent: 0,
          estimatedCostSavedGPT: 0,
          estimatedCostSavedClaude: 0,
        },
      );
    } catch (err) {
      console.error("❌ Fetch tokens error:", err);
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchTokensSaved();

    const startPolling = () => {
      if (!pollRef.current) {
        console.log("📡 Polling started...");
        setUsingPolling(true);
        pollRef.current = setInterval(() => {
          fetchDocs();
          fetchTokensSaved();
        }, 3000);
      }
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setUsingPolling(false);
      }
    };

    const setupSignalR = async () => {
      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl("https://localhost:7022/hubs/document", {
            withCredentials: true,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Warning)
          .build();

        connectionRef.current = connection;

        connection.onreconnecting(() => {
          console.log("🔄 Reconnecting...");
          setConnected(false);
          setConnectionError("Reconnecting...");
        });

        connection.onreconnected(() => {
          console.log("✅ Reconnected");
          setConnected(true);
          setConnectionError("");
          stopPolling();
          fetchDocs();
          fetchTokensSaved();
        });

        connection.onclose((err) => {
          console.log("❌ Disconnected:", err);
          setConnected(false);
          setConnectionError("SignalR disconnected");
          startPolling();
        });

        // 🔥 REAL-TIME EVENT (FIXED)
        connection.on("ReceiveDocument", (data) => {
          console.log("📡 SignalR:", data);

          if (!data?.fileName) return;

          const fileName = data.fileName.trim().toLowerCase();

          setDocs((prev) => {
            const exists = prev.find(
              (d) => d.fileName?.trim().toLowerCase() === fileName,
            );

            if (exists) {
              return prev.map((d) =>
                d.fileName?.trim().toLowerCase() === fileName
                  ? {
                      ...d,
                      status: data.status,
                      content: data.content,
                      updatedAt: new Date().toISOString(),
                    }
                  : d,
              );
            }

            return [
              ...prev,
              {
                fileName: data.fileName,
                status: data.status,
                content: data.content,
                uploadedAt: new Date().toISOString(),
              },
            ];
          });
        });

        // 🔥 REAL-TIME TOKEN SAVINGS UPDATE
        connection.on("TokensSavedUpdated", (data) => {
          console.log("💰 Tokens Updated:", data);
          setTokensSaved(data);
        });

        await connection.start();

        console.log("✅ SignalR Connected");
        setConnected(true);
        setConnectionError("");
        stopPolling();
      } catch (err) {
        console.error("❌ SignalR failed:", err);
        setConnected(false);
        setConnectionError("SignalR failed. Using polling.");
        startPolling();
      }
    };

    setupSignalR();

    return () => {
      console.log("🧹 Cleanup");

      if (pollRef.current) clearInterval(pollRef.current);

      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  // 🎨 Status color & styling
  const getStatusConfig = (status) => {
    const normalizedStatus = (status || "").toLowerCase();
    const configs = {
      processing: {
        color: "#f59e0b",
        label: "⏳ Processing",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
      },
      processed: {
        color: "#10b981",
        label: "✓ Processed",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
      },
      completed: {
        color: "#10b981",
        label: "✓ Completed",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
      },
      failed: {
        color: "#ef4444",
        label: "✗ Failed",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
      },
    };
    return (
      configs[normalizedStatus] || {
        color: "#9ca3af",
        label: "Unknown",
        backgroundColor: "rgba(156, 163, 175, 0.15)",
      }
    );
  };

  // 🔥 DOWNLOAD FUNCTION (FIXED)
  const downloadMarkdown = (doc) => {
    if (!doc?.content) {
      alert("No content available yet!");
      return;
    }

    const cleanName = doc.fileName.replace(/\.[^/.]+$/, "");

    const blob = new Blob([doc.content], {
      type: "text/markdown;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanName}.md`;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  // Filter documents
  const filteredDocs = docs.filter((doc) =>
    doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayedDocs = filteredDocs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // 🎨 Stats Card Component
  const StatsCard = ({
    icon: Icon,
    title,
    value,
    subtext,
    gradient,
    delay,
  }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        p: 3,
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        animation: `slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`,
        "@keyframes slideUp": {
          from: { opacity: 0, transform: "translateY(30px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "&:hover": {
          transform: "translateY(-8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={{
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: "28px", color: "white" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              mb: 0.5,
              letterSpacing: "-0.5px",
            }}
          >
            {value}
          </Typography>
          {subtext && (
            <Typography
              sx={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              {subtext}
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );

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
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "white",
              mb: 1,
              fontSize: { xs: "24px", md: "32px" },
            }}
          >
            Documents
          </Typography>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "14px",
            }}
          >
            Manage and monitor your processed documents
          </Typography>
        </Box>

        {/* 🔥 TOKEN SAVINGS STATS SECTION */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              icon={BoltIcon}
              title="Tokens Saved"
              value={tokensSaved.tokensSaved.toLocaleString()}
              subtext="Total optimization"
              gradient={["rgba(59, 130, 246, 0.2)", "rgba(99, 102, 241, 0.2)"]}
              delay={0}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              icon={TrendingDownIcon}
              title="Reduction"
              value={`${tokensSaved.reductionPercent}%`}
              subtext="Efficiency gain"
              gradient={["rgba(16, 185, 129, 0.2)", "rgba(34, 197, 94, 0.2)"]}
              delay={0.1}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              icon={AttachMoneyIcon}
              title="GPT-4 Saved"
              value={`$${tokensSaved.estimatedCostSavedGPT.toFixed(2)}`}
              subtext="OpenAI cost savings"
              gradient={["rgba(168, 85, 247, 0.2)", "rgba(139, 92, 246, 0.2)"]}
              delay={0.2}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              icon={LocalFireDepartmentIcon}
              title="Claude Saved"
              value={`$${tokensSaved.estimatedCostSavedClaude.toFixed(2)}`}
              subtext="Anthropic cost savings"
              gradient={["rgba(244, 63, 94, 0.2)", "rgba(239, 68, 68, 0.2)"]}
              delay={0.3}
            />
          </Grid>
        </Grid>

        {/* Status Bar */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            mb: 3,
            flexWrap: "wrap",
            animation: "slideDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            "@keyframes slideDown": {
              from: { opacity: 0, transform: "translateY(-20px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Chip
            icon={connected ? SignalCellularAltIcon : CloudOffIcon}
            label={connected ? "🟢 SignalR Connected" : "🔴 Disconnected"}
            color={connected ? "success" : "error"}
            variant="outlined"
            sx={{
              background: connected
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${connected ? "#10b981" : "#ef4444"}`,
              color: connected ? "#10b981" : "#ef4444",
              fontWeight: 600,
              fontSize: "13px",
            }}
          />
          {usingPolling && (
            <Chip
              label="📡 Polling Mode"
              variant="outlined"
              sx={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid #f59e0b",
                color: "#f59e0b",
                fontWeight: 600,
                fontSize: "13px",
              }}
            />
          )}
        </Box>

        {/* Error Alert */}
        {connectionError && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.08))",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "12px",
              color: "#f59e0b",
              animation: "slideDown 0.4s ease-out",
            }}
          >
            {connectionError}
          </Alert>
        )}

        {/* Search Bar */}
        <TextField
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          sx={{
            mb: 3,
            width: "100%",
            "& .MuiOutlinedInput-root": {
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "white",
              transition: "all 0.3s",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.08)",
                borderColor: "rgba(59, 130, 246, 0.4)",
              },
              "&.Mui-focused": {
                background: "rgba(255, 255, 255, 0.1)",
                borderColor: "#3b82f6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
              },
            },
            "& .MuiOutlinedInput-input": {
              fontSize: "14px",
              "&::placeholder": {
                color: "rgba(255, 255, 255, 0.4)",
                opacity: 1,
              },
            },
            "& .MuiInputAdornment-positionEnd": {
              color: "rgba(255, 255, 255, 0.5)",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ fontSize: "20px" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Table Container */}
        <TableContainer
          component={Paper}
          sx={{
            background:
              "linear-gradient(135deg, rgba(26, 31, 46, 0.8), rgba(15, 20, 25, 0.8))",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            overflow: "hidden",
            animation:
              "slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both",
            "@keyframes slideUp": {
              from: { opacity: 0, transform: "translateY(30px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: "rgba(59, 130, 246, 0.05)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  "& th": {
                    fontWeight: 700,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "rgba(255, 255, 255, 0.7)",
                    padding: "16px",
                    background: "transparent",
                  },
                }}
              >
                <TableCell>File Name</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Date</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayedDocs.length > 0 ? (
                displayedDocs.map((doc, index) => {
                  const statusConfig = getStatusConfig(doc.status);
                  return (
                    <TableRow
                      key={doc.fileName}
                      sx={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                        transition: "all 0.3s",
                        animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
                        "&:hover": {
                          background: "rgba(59, 130, 246, 0.08)",
                        },
                        "@keyframes fadeIn": {
                          from: { opacity: 0, transform: "translateX(-10px)" },
                          to: { opacity: 1, transform: "translateX(0)" },
                        },
                        "& td": {
                          color: "rgba(255, 255, 255, 0.8)",
                          padding: "16px",
                          borderBottom: "transparent",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          fontSize: "14px",
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {doc.fileName}
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "inline-flex",
                            px: 2,
                            py: 1,
                            background: statusConfig.backgroundColor,
                            border: `1px solid ${statusConfig.color}`,
                            borderRadius: "8px",
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: "12px",
                            transition: "all 0.3s",
                            animation: `pulse 2s ease-in-out infinite`,
                            "@keyframes pulse": {
                              "0%, 100%": { opacity: 1 },
                              "50%": {
                                opacity:
                                  doc.status?.toLowerCase() === "processing"
                                    ? 0.7
                                    : 1,
                              },
                            },
                          }}
                        >
                          {statusConfig.label}
                        </Box>
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          fontSize: "13px",
                          color: "rgba(255, 255, 255, 0.6)",
                        }}
                      >
                        {doc.updatedAt || doc.uploadedAt
                          ? new Date(
                              doc.updatedAt || doc.uploadedAt,
                            ).toLocaleString()
                          : "—"}
                      </TableCell>

                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<GetAppIcon />}
                          onClick={() => downloadMarkdown(doc)}
                          disabled={!doc.content}
                          sx={{
                            background: doc.content
                              ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                              : "rgba(255, 255, 255, 0.1)",
                            color: "white",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "12px",
                            py: 0.75,
                            px: 2,
                            borderRadius: "8px",
                            transition: "all 0.3s",
                            border: "none",
                            "&:hover": doc.content
                              ? {
                                  transform: "translateY(-2px)",
                                  boxShadow:
                                    "0 6px 16px rgba(59, 130, 246, 0.3)",
                                }
                              : {},
                            "&:disabled": {
                              cursor: "not-allowed",
                            },
                          }}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{
                      py: 6,
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "14px",
                    }}
                  >
                    {searchQuery
                      ? "No documents match your search"
                      : "No documents yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filteredDocs.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filteredDocs.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              "& .MuiTablePagination-root": {
                color: "rgba(255, 255, 255, 0.6)",
              },
              "& .MuiIconButton-root": {
                color: "rgba(255, 255, 255, 0.6)",
                "&:hover": {
                  background: "rgba(59, 130, 246, 0.1)",
                },
              },
              "& .MuiSelect-icon": {
                color: "rgba(255, 255, 255, 0.6)",
              },
            }}
          />
        )}
      </Box>
    </Layout>
  );
}
