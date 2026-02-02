import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function HtmlOrText({ className, text }: { className?: string; text?: string }) {
  const hasRuby = typeof text === 'string' && /<\s*(ruby|rb|rt|rp)\b/i.test(text);
  if (hasRuby) {
    return <Box className={className} dangerouslySetInnerHTML={{ __html: text! }} />;
  }
  return (
    <Typography className={className} variant="h5" component="div">
      {text}
    </Typography>
  );
}

export default HtmlOrText;
