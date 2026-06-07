import Layout from "../components/Layout";
import {
  Box,
  Button,
  Card,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { useState, useRef } from "react";
import api from "../services/api";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: "info",
    message: "",
  });
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
  };

  const handleUpload = async () => {
    if (!file) {
      showSnackbar("warning", "Please select a file first");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("File", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 30;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      showSnackbar("success", `${file.name} uploaded successfully!`);
      setFile(null);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error(err);
      showSnackbar("error", "Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
            Upload Document
          </Typography>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "14px",
            }}
          >
            Drag and drop your document or click to browse
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 600, mx: "auto" }}>
          {/* Upload Card */}
          <Card
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              background: isDragActive
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(6, 182, 212, 0.08))",
              backdropFilter: "blur(10px)",
              border: `2px dashed ${isDragActive ? "#3b82f6" : "rgba(59, 130, 246, 0.3)"}`,
              borderRadius: "16px",
              p: 4,
              textAlign: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              "&:hover": {
                borderColor: "#3b82f6",
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.12))",
              },
            }}
          >
            {/* Animated background */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isDragActive
                  ? "radial-gradient(circle at center, rgba(59, 130, 246, 0.2), transparent)"
                  : "transparent",
                animation: isDragActive
                  ? "pulse 2s ease-in-out infinite"
                  : "none",
                pointerEvents: "none",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 0.5 },
                  "50%": { opacity: 1 },
                },
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              {file ? (
                // File Selected State
                <Box>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      background:
                        "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <CheckCircleIcon
                      sx={{
                        fontSize: "40px",
                        color: "#10b981",
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "white",
                      mb: 1,
                      wordBreak: "break-word",
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.6)",
                      mb: 3,
                    }}
                  >
                    {formatFileSize(file.size)} • Ready to upload
                  </Typography>

                  {loading && uploadProgress > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={uploadProgress}
                          sx={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "2px",
                            background: "rgba(255, 255, 255, 0.1)",
                            "& .MuiLinearProgress-bar": {
                              background:
                                "linear-gradient(90deg, #3b82f6, #06b6d4)",
                              borderRadius: "2px",
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#3b82f6",
                            fontWeight: 600,
                            minWidth: "35px",
                          }}
                        >
                          {Math.round(uploadProgress)}%
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleUpload}
                      disabled={loading}
                      sx={{
                        flex: 1,
                        background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: "10px",
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                        },
                        "&:disabled": {
                          background: "rgba(59, 130, 246, 0.5)",
                        },
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress
                            size={18}
                            sx={{ mr: 1, color: "inherit" }}
                          />
                          Uploading...
                        </>
                      ) : (
                        "Upload File"
                      )}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => {
                        setFile(null);
                        setUploadProgress(0);
                      }}
                      disabled={loading}
                      sx={{
                        flex: 1,
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        color: "white",
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: "10px",
                        transition: "all 0.3s",
                        "&:hover": {
                          borderColor: "rgba(255, 255, 255, 0.6)",
                          background: "rgba(255, 255, 255, 0.05)",
                        },
                      }}
                    >
                      Clear
                    </Button>
                  </Box>
                </Box>
              ) : (
                // No File State
                <Box>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15))",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                      transition: "all 0.3s",
                      transform: isDragActive ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    <CloudUploadIcon
                      sx={{
                        fontSize: "48px",
                        color: "#3b82f6",
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "white",
                      mb: 1,
                    }}
                  >
                    Drop your file here
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.6)",
                      mb: 3,
                    }}
                  >
                    or click to browse from your computer
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={() => inputRef.current?.click()}
                    sx={{
                      background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      borderRadius: "10px",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 24px rgba(59, 130, 246, 0.3)",
                      },
                    }}
                  >
                    Browse Files
                  </Button>

                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.5)",
                      mt: 2,
                    }}
                  >
                    PDF, DOCX, TXT, MD supported
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Hidden input */}
            <input
              ref={inputRef}
              type="file"
              hidden
              onChange={handleFileChange}
            />
          </Card>
        </Box>
      </Box>

      {/* Snackbars */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.type}
          variant="filled"
          sx={{
            background:
              snackbar.type === "success"
                ? "linear-gradient(135deg, #10b981, #059669)"
                : snackbar.type === "error"
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
          }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
