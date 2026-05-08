import DOMPurify from 'dompurify';

/**
 * SafeHtml Component
 * 
 * Sanitizes HTML content before rendering to prevent XSS.
 * Crucial for clinical notes and patient-provided data.
 */
export const SafeHtml = ({ html, className, style }: { html: string; className?: string; style?: React.CSSProperties }) => {
  const sanitized = DOMPurify.sanitize(html);
  
  return (
    <div 
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }} 
    />
  );
};
