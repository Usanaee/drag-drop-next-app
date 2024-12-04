"use client";
import React, { useCallback, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Model() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSizeError, setFileSizeError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      setFileSizeError(
        "File size exceeds the limit! Please upload a smaller file."
      );
      setSelectedFile(null);
    } else {
      setSelectedFile(acceptedFiles[0]);
      setFileSizeError("");
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"], // Allow image files
      "application/pdf": [".pdf"], // Allow PDFs
      "video/*": [".mp4", ".webm", ".ogg"], // Allow video files
      "text/plain": [".txt"], // Allow text files
    },
    maxFiles: 1, // Limit to one file
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Get the pre-signed URL from the backend using axios
      const response = await axios.post("/api/upload", {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      const { uploadURL } = response.data;

      if (uploadURL) {
        // Step 2: Upload the file to S3 using the pre-signed URL with axios
        const UPLOAD_DURATION = 30 * 1000;
        const intervalTime = 3000;

        let elapsedTime = 0;
        const interval = setInterval(() => {
          elapsedTime += intervalTime;

          // Calculate progress based on elapsed time
          const progress = Math.min((elapsedTime / UPLOAD_DURATION) * 100, 100);
          setUploadProgress(progress);

          // When upload reaches 100%, clear the interval
          if (progress === 100) {
            clearInterval(interval);
          }
        }, intervalTime);

        // Step 3: Upload the file to S3 with axios and track progress
        const uploadResponse = await axios.put(uploadURL, selectedFile, {
          headers: {
            "Content-Type": selectedFile.type,
          },
          onUploadProgress: (progressEvent) => {
            // Calculate progress percentage based on the uploaded bytes
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          },
        });

        if (uploadResponse.status === 200) {
          setIsUploading(false);
          toast.success("File uploaded successfully!");
        } else {
          throw new Error("Upload failed");
        }

        clearInterval(interval); // Clear interval when upload completes
      } else {
        throw new Error("Error getting pre-signed URL");
      }
    } catch (error) {
      setIsUploading(false);
      setUploadError("An error occurred during the upload. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Dialog>
        <DialogTrigger asChild>
          <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Open Modal
          </button>
        </DialogTrigger>

        <DialogContent>
          <DialogTitle>Upload File</DialogTitle>

          <div
            {...getRootProps()}
            className={`mt-4 p-6 border-2 border-dashed rounded-lg cursor-pointer ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <p>
                Drag & drop a file here, or{" "}
                <span className="text-blue-500 underline">
                  click to select one
                </span>
              </p>
            )}
          </div>

          {fileSizeError && (
            <p className="mt-2 text-sm text-red-500">{fileSizeError}</p>
          )}

          {selectedFile && !fileSizeError && (
            <div className="mt-4">
              <p className="text-sm text-green-500">
                Selected File: {selectedFile.name}
              </p>
              {!isUploading && (
                <button
                  onClick={handleUpload}
                  className="mt-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Upload File
                </button>
              )}
            </div>
          )}

          {isUploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="mt-2 text-sm text-gray-600">
                {Math.round(uploadProgress)}% uploaded
              </p>
            </div>
          )}

          {uploadError && (
            <p className="mt-2 text-sm text-red-500">{uploadError}</p>
          )}
        </DialogContent>
      </Dialog>
      <ToastContainer />
    </div>
  );
}
