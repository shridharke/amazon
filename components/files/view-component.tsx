"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { getS3Url } from "@/lib/s3";

type ViewComponentProps = {
  url: string;
  onClose: () => void;
};

const ViewComponent: React.FC<ViewComponentProps> = ({ url, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "50px",
          right: "130px",
          background: "none",
          border: "none",
          cursor: "pointer",
          zIndex: 1001,
        }}
      >
        <Icon icon="mdi:close" className="h-8 w-8 text-white" />
      </button>

      {/* Iframe container */}
      <div
        style={{
          position: "relative",
          width: "80%",
          height: "80%",
          backgroundColor: "white",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <iframe
          src={`https://docs.google.com/gview?url=${url}&embedded=true`}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default ViewComponent;
