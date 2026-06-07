import Layout from "../components/Layout";
import { Box, Card, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import api from "../services/api";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await api.get("/documents");
      const docs = res.data || [];

      const total = docs.length;

      const processing = docs.filter(
        (d) => (d.status || "").toLowerCase() === "processing",
      ).length;

      const completed = docs.filter((d) =>
        ["completed", "processed"].includes((d.status || "").toLowerCase()),
      ).length;

      const failed = docs.filter(
        (d) => (d.status || "").toLowerCase() === "failed",
      ).length;

      setStats({ total, processing, completed, failed });
    } catch (err) {
      console.error("❌ Failed to fetch dashboard stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ label, value, icon: Icon, color, delay }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.15), rgba(${color.r}, ${color.g}, ${color.b}, 0.08))`,
        backdropFilter: "blur(10px)",
        border: `1px solid rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`,
        borderRadius: "16px",
        p: 3,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: `slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`,
        "&:hover": {
          transform: "translateY(-8px)",
          borderColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`,
          background: `linear-gradient(135deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.2), rgba(${color.r}, ${color.g}, ${color.b}, 0.12))`,
          boxShadow: `0 20px 40px rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`,
        },
        "@keyframes slideUp": {
          from: {
            opacity: 0,
            transform: "translateY(30px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
      }}
    >
      {/* Background accent */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, rgba(${color.r}, ${color.g}, ${color.b}, 0.2), transparent)`,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: `rgb(${color.r}, ${color.g}, ${color.b})`,
            }}
          >
            <Icon sx={{ fontSize: "20px" }} />
          </Box>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "42px",
              fontWeight: 800,
              color: `rgb(${color.r}, ${color.g}, ${color.b})`,
              lineHeight: 1,
              mb: 1,
            }}
          >
            {value}
          </Typography>
          <Box
            sx={{
              height: "4px",
              background: `linear-gradient(90deg, rgb(${color.r}, ${color.g}, ${color.b}), transparent)`,
              borderRadius: "2px",
              width: `${Math.min((value / stats.total) * 100, 100)}%`,
              transition: "width 0.5s ease-out",
            }}
          />
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
            Dashboard
          </Typography>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "14px",
            }}
          >
            Overview of document processing status
          </Typography>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              label="Total Documents"
              value={stats.total}
              icon={TrendingUpIcon}
              color={{ r: 59, g: 130, b: 246 }}
              delay={0}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              label="Processing"
              value={stats.processing}
              icon={ScheduleIcon}
              color={{ r: 245, g: 158, b: 11 }}
              delay={0.1}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircleIcon}
              color={{ r: 16, g: 185, b: 129 }}
              delay={0.2}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              label="Failed"
              value={stats.failed}
              icon={ErrorIcon}
              color={{ r: 239, g: 68, b: 68 }}
              delay={0.3}
            />
          </Grid>
        </Grid>

        {/* Summary Section */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "16px",
            animation:
              "slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both",
            "@keyframes slideUp": {
              from: {
                opacity: 0,
                transform: "translateY(30px)",
              },
              to: {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
          }}
        >
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>
              {stats.total}
            </span>{" "}
            document{stats.total !== 1 ? "s" : ""} in the system •{" "}
            <span style={{ color: "#f59e0b", fontWeight: 600 }}>
              {stats.processing}
            </span>{" "}
            processing •{" "}
            <span style={{ color: "#10b981", fontWeight: 600 }}>
              {stats.completed}
            </span>{" "}
            completed •{" "}
            <span style={{ color: "#ef4444", fontWeight: 600 }}>
              {stats.failed}
            </span>{" "}
            failed
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
}
