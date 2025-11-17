interface CodeViewerWithLineNumbersProps {
  code: string;
  language?: string;
}

export const CodeViewerWithLineNumbers = ({ code, language = 'html' }: CodeViewerWithLineNumbersProps) => {
  const lines = code.split('\n');

  return (
    <div className="flex bg-muted/30 rounded-lg overflow-hidden border border-border">
      {/* Line numbers column */}
      <div className="bg-muted/50 text-muted-foreground text-right pr-4 pl-2 py-4 select-none border-r border-border">
        {lines.map((_, index) => (
          <div
            key={index}
            className="leading-6 text-xs font-mono"
            style={{ height: '24px' }}
          >
            {index + 1}
          </div>
        ))}
      </div>
      
      {/* Code content */}
      <div className="flex-1 overflow-x-auto">
        <pre className="p-4 text-xs font-mono leading-6 text-foreground">
          <code className={`language-${language}`}>
            {lines.map((line, index) => (
              <div key={index} style={{ height: '24px' }}>
                {line || ' '}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
