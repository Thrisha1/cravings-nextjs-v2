"use client";
import React, { useState } from "react";

const DescriptionWithTextBreak = ({
  accent = "blue",
  children,
  className = "",
  maxWidth = 300,
  maxLines = 3,
  maxChars = 100,
  breakChars = 50,
  style = {},
}: {
  children: React.ReactNode;
  accent?: string;
  className?: string;
  maxWidth?: number;
  maxLines?: number;
  maxChars?: number;
  breakChars?: number; // New prop for breaking long words
  style?: React.CSSProperties;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert children to string
  const text = React.Children.toArray(children).join("");

  // Function to insert line breaks after every N characters for long words
  const formatText = (text: string) => {
    return text.split(/\s+/).map((word) => {
      if (word.length > breakChars) {
        return word.replace(new RegExp(`(.{${breakChars}})`, 'g'), '$1\u200B');
      }
      return word;
    }).join(' ');
  };

  // Apply formatting only if not expanded
  const formattedText = isExpanded ? text : formatText(text);

  // Check if text needs truncation
  const needsTruncation = text.length > maxChars;
  const truncatedText = needsTruncation ? `${formattedText.slice(0, maxChars)}...` : formattedText;
  const displayText = isExpanded ? text : truncatedText;

  // Style for line clamping
  const lineClampStyle = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as const,
    WebkitLineClamp: isExpanded ? "none" : maxLines,
    overflow: "hidden",
    margin: 0,
    padding: 0,
    lineHeight: 1.5,
    maxWidth: `${maxWidth}px`,
    wordBreak: "break-word" as const, // Ensure long words can break
    overflowWrap: "break-word" as const, // Alternative property for word breaking
  };

  return (
    <div className={className}>
      <p style={{
        ...lineClampStyle,
        ...style,
      }}>
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
              display: "inline",
              whiteSpace: "nowrap",
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