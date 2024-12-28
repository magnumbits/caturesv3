import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';

interface LogEntry {
  message: string;
  timestamp: Date;
  type: 'info' | 'error';
}

export default function DebugConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Override console methods
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      setLogs(prev => [...prev, {
        message: args.map(arg => 
          arg === null ? 'null' :
          arg === undefined ? 'undefined' :
          typeof arg === 'object' ? 
            arg instanceof Error ? arg.message :
            JSON.stringify(arg, (key, value) => {
              if (value instanceof Error) return value.message;
              if (typeof value === 'symbol') return value.toString();
              return value;
            }, 2) 
          : String(arg)
        ).join(' '),
        timestamp: new Date(),
        type: 'info'
      }]);
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      setLogs(prev => [...prev, {
        message: args.map(arg => 
          arg === null ? 'null' :
          arg === undefined ? 'undefined' :
          typeof arg === 'object' ? 
            arg instanceof Error ? arg.message :
            JSON.stringify(arg, (key, value) => {
              if (value instanceof Error) return value.message;
              if (typeof value === 'symbol') return value.toString();
              return value;
            }, 2) 
          : String(arg)
        ).join(' '),
        timestamp: new Date(),
        type: 'error'
      }]);
    };

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
      >
        <Terminal size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-800 text-white rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Terminal size={16} />
          Debug Console
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`mb-1 ${
              log.type === 'error' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            <span className="text-gray-500">
              {log.timestamp.toLocaleTimeString()}
            </span>{' '}
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}