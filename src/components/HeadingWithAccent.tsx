import React from "react";

const HeadingWithAccent = ({
  children,
  accent,
  className
}: {
  children: React.ReactNode;
  accent: string;
  className?: string;
}) => {
  // Convert children to string
  const text = React.Children.toArray(children).join("");
  
  // Split text into words
  const words = text.trim().split(/\s+/);
  
  if (words.length > 1) {
    // Multiple words: accent last word
    return (
      <h1 className={className}>
        {words.slice(0, -1).join(" ")}{" "}
        <span style={{ color: accent }}>{words[words.length - 1]}</span>
      </h1>
    );
  } else if (words[0].length > 3) {
    // Single word with more than 3 letters: accent last 3 letters
    const word = words[0];
    return (
      <h1 className={className}>
        {word.slice(0, -3)}
        <span style={{ color: accent }}>{word.slice(-3)}</span>
      </h1>
    );
  } else {
    // Single word with 3 or fewer letters: accent entire word
    return (
      <h1 className={className}>
        <span style={{ color: accent }}>{words[0]}</span>
      </h1>
    );
  }
};

export default HeadingWithAccent;