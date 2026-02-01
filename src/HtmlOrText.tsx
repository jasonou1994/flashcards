import React from 'react';

export function HtmlOrText({ className, text }: { className?: string; text?: string }) {
  const hasRuby = typeof text === 'string' && /<\s*(ruby|rb|rt|rp)\b/i.test(text);
  if (hasRuby) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: text! }} />;
  }
  return <div className={className}>{text}</div>;
}

export default HtmlOrText;
