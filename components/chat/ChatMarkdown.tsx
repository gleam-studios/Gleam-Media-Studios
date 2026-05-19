import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import styles from "./chat-markdown.module.css";

const mdComponents: Components = {
  p: ({ children }) => <p className={styles.p}>{children}</p>,
  a: ({ children, href }) => (
    <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
  code(props) {
    const { className, children, ...rest } = props;
    const inline = !/\blanguage-[\w-]+\b/.test(className ?? "");
    if (inline) {
      return (
        <code className={styles.codeInline} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} className={styles.img} />,
};

export function ChatMarkdown({ markdown }: { markdown: string }) {
  const trimmed = markdown.trim();
  if (!trimmed) return null;
  return (
    <div className={styles.root}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
