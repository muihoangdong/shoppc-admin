import React from 'react';

/**
 * Hiển thị văn bản trả lời của AI với một phần nhỏ markdown (đoạn, danh sách, **đậm**, `code`).
 * Chỉ tạo phần tử React (không dùng dangerouslySetInnerHTML) nên an toàn trước chèn HTML/script.
 */

const renderInline = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-black/10 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd();
    const last = blocks[blocks.length - 1];
    const bullet = line.match(BULLET);
    const numbered = line.match(NUMBERED);

    if (!line.trim()) {
      blocks.push({ type: 'p', lines: [] }); // ngắt đoạn
    } else if (bullet) {
      if (last?.type === 'ul') last.items.push(bullet[1]);
      else blocks.push({ type: 'ul', items: [bullet[1]] });
    } else if (numbered) {
      if (last?.type === 'ol') last.items.push(numbered[1]);
      else blocks.push({ type: 'ol', items: [numbered[1]] });
    } else {
      const content = line.replace(HEADING, '**$1**');
      if (last?.type === 'p') last.lines.push(content);
      else blocks.push({ type: 'p', lines: [content] });
    }
  }
  return blocks.filter((b) => (b.type === 'p' ? b.lines.length > 0 : true));
};

const RichText: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-2 break-words">
    {parseBlocks(text).map((block, i) => {
      if (block.type === 'ul') {
        return (
          <ul key={i} className="list-disc space-y-0.5 pl-5">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      }
      if (block.type === 'ol') {
        return (
          <ol key={i} className="list-decimal space-y-0.5 pl-5">
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      return (
        <p key={i}>
          {block.lines.map((line, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(line)}
            </React.Fragment>
          ))}
        </p>
      );
    })}
  </div>
);

export default RichText;
