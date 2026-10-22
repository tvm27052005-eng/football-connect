import React from 'react';

// Limited Markdown. React escapes all text; HTML, images and links are not parsed.
export function AssistantText({ text }: { text: string }) {
  return <div className="space-y-1 text-sm leading-relaxed [overflow-wrap:anywhere]">
    {text.split('\n').map((line, index) => <p key={index} className="min-h-2">
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
    </p>)}
  </div>;
}
