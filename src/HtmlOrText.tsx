import React from 'react';
import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';

export function HtmlOrText({ className, text, variant = 'h5' }: { className?: string; text?: string; variant?: TypographyProps['variant'] }) {
  const hasRuby = typeof text === 'string' && /<\s*(ruby|rb|rt|rp)\b/i.test(text);
  if (hasRuby) {
    return (
      <Typography
        className={className}
        variant={variant}
        component="div"
        align="center"
        sx={{ width: '100%' }}
        dangerouslySetInnerHTML={{ __html: text! }}
      />
    );
  }
  return (
    <Typography className={className} variant={variant} component="div" align="center" sx={{ width: '100%' }}>
      {text}
    </Typography>
  );
}

export default HtmlOrText;
