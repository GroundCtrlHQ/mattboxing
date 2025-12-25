'use client';

import { Streamdown } from 'streamdown';

interface StreamdownMarkdownProps {
  content: string;
  className?: string;
  mode?: 'static' | 'streaming';
}

export function StreamdownMarkdown({ content, className = '', mode = 'streaming' }: StreamdownMarkdownProps) {
  return (
    <Streamdown 
      mode={mode} 
      parseIncompleteMarkdown={true}
      className={className}
    >
      {content}
    </Streamdown>
  );
}

