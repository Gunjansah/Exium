'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizableOutputProps {
  output: string;
  outputDetails: any;
}

export default function ResizableOutput({ output, outputDetails }: ResizableOutputProps) {
  const [height, setHeight] = useState(200);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dy = e.clientY - startY.current;
      const newHeight = Math.max(100, startHeight.current - dy);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.body.style.cursor = 'row-resize';
  };

  return (
    <div className="w-full">
      <div 
        className="w-full bg-gray-800 text-white rounded-t-md cursor-row-resize p-1 text-sm"
        onMouseDown={handleMouseDown}
      >
        Output {outputDetails && `(${outputDetails.status?.description})`}
      </div>
      <div 
        className="w-full bg-[#1e293b] text-white rounded-b-md overflow-auto p-4"
        style={{ height: `${height}px` }}
      >
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {output}
        </pre>
        {outputDetails && (
          <div className="mt-4 text-xs text-gray-400">
            <div>Time: {outputDetails.time} seconds</div>
            <div>Memory: {outputDetails.memory} KB</div>
          </div>
        )}
      </div>
    </div>
  );
} 