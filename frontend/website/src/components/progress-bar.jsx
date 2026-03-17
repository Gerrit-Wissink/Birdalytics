import { useState } from "react";

export default function ProgressBar ({ totalImages, imagesReviewed }){
    const [hovered, setHovered] = useState(false);
    const [mouseX, setMouseX] = useState(0);

    const percentage = totalImages > 0
        ? Math.min((imagesReviewed / totalImages) * 100, 100)
        : 0;

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMouseX(e.clientX - rect.left);
    };

    return (
        <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
        {hovered && (
            <div style={{
            position: "absolute",
            bottom: "14px",
            left: `${mouseX}px`,
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
            }}>
            {imagesReviewed} of {totalImages} images reviewed
            </div>
        )}

        <div
            style={{ position: "relative", width: "100%", height: "6px", borderRadius: "3px", backgroundColor: "#757575", cursor: "pointer" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={handleMouseMove}
        >
            <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${percentage}%`,
            borderRadius: "3px",
            backgroundColor: "#F0A019",
            transition: "width 0.4s ease",
            }} />
        </div>
        </div>
    );
};