import { useState, useRef } from 'react';
import Papa from 'papaparse';

interface FileUploadProps {
  label: string;
  onLoad: (data: Record<string, string>[], fileName: string) => void;
  hint?: string;
}

const FileUpload = ({ label, onLoad, hint }: FileUploadProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = label.replace(/\s+/g, '-').toLowerCase();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => onLoad(res.data as Record<string, string>[], file.name),
    });
  };

  return (
    <div className="vax-file-upload" onClick={() => inputRef.current?.click()}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
        id={inputId}
      />
      <div className="text-[13px] font-medium text-foreground">{fileName || label}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
};

export default FileUpload;
