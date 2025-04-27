"use client";
import React, { useState } from "react";

const DescriptionWithTextBreak = ({
  accent = "blue",
  children,
  className = "",
  maxWidth = 300,
  maxLines = 3,
  maxChars = 100,
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
  maxWidth?: number;
  maxLines?: number;
  maxChars?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert children to string
  const text = React.Children.toArray(children).join("");

  // Check if text needs truncation
  const needsTruncation = text.length > maxChars;
  const truncatedText = needsTruncation ? `${text.slice(0, maxChars)}...` : text;
  const displayText = isExpanded ? text : truncatedText;

  // Style for line clamping
  const lineClampStyle = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: isExpanded ? "none" : maxLines,
    overflow: "hidden",
    margin: 0,
    padding: 0,
    lineHeight: 1.5,
    maxWidth: `${maxWidth}px`,
  } as React.CSSProperties;

  return (
    <div className={className}>
      <p  style={lineClampStyle}>
        <span className="opacity-70">{displayText}</span>
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              color: accent,
              background: "none",
              opacity: 1,
              border: "none",
              padding: 0,
              paddingLeft: "4px",
              cursor: "pointer",
              display: "inline", // Ensures button stays on the same line
              whiteSpace: "nowrap", // Prevents button text from breaking
            }}
          >
            {isExpanded ? " less" : " more"}
          </button>
        )}
      </p>
    </div>
  );
};

export default DescriptionWithTextBreak;