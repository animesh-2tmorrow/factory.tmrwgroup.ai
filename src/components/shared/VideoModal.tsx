"use client";

import { useState, useRef, useEffect } from "react";
import { PlayCircle, X } from "lucide-react";

interface VideoModalProps {
  videoSrc: string;
  buttonText?: string;
  buttonClassName?: string;
}

export default function VideoModal({
  videoSrc,
  buttonText = "See it in Action",
  buttonClassName = "vf-button-secondary",
}: VideoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setIsOpen(true)}
        aria-label={buttonText}
      >
        <PlayCircle size={14} />
        {buttonText}
      </button>

      {isOpen && (
        <div
          className="vf-video-modal-backdrop"
          onClick={handleBackdropClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-6)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1000px",
              background: "var(--surface)",
              borderRadius: "var(--vf-radius-lg)",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              animation: "scaleIn 0.25s ease-out",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close video"
              style={{
                position: "absolute",
                top: "var(--space-3)",
                right: "var(--space-3)",
                zIndex: 10,
                background: "rgba(0, 0, 0, 0.6)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)")}
            >
              <X size={18} />
            </button>
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              playsInline
              style={{
                width: "100%",
                display: "block",
                maxHeight: "80vh",
              }}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
