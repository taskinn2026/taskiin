import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Activity, Filter, Pause, Play, Download } from 'lucide-react';

const NetworkDebugger = () => {
    const [requests, setRequests] = useState([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [filter, setFilter] = useState('');
    const [minimized, setMinimized] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        // 1. Monkey patch fetch to capture ALL network traffic
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource, config] = args;
            const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : String(resource);
            const method = config?.method || (resource instanceof Request ? resource.method : 'GET');

            // Dispatch event for debugger
            const event = new CustomEvent('network-request', {
                detail: {
                    method,
                    url,
                    timestamp: new Date().toISOString(),
                    status: 'PENDING'
                }
            });
            window.dispatchEvent(event);

            try {
                const response = await originalFetch(...args);
                return response;
            } catch (error) {
                throw error;
            }
        };

        // 2. Listen to the custom event (dispatched by our patch OR manual dispatch)
        const handleRequest = (event) => {
            if (isPaused) return;
            const { method, url, timestamp } = event.detail;

            // Filter out noise (Vite HMR, etc if needed)
            if (url.includes('vite') || url.includes('localhost')) return;

            setRequests(prev => {
                const newReq = {
                    id: Date.now() + Math.random(),
                    method,
                    url,
                    timestamp: new Date(timestamp).toLocaleTimeString(),
                    status: 'OK'
                };
                const updated = [...prev, newReq];
                if (updated.length > 50) return updated.slice(updated.length - 50);
                return updated;
            });
        };

        window.addEventListener('network-request', handleRequest);

        return () => {
            window.removeEventListener('network-request', handleRequest);
            // We do NOT restore window.fetch to avoid breaking pending requests during HMR, 
            // and because this is a debugging session.
        };
    }, [isPaused]);

    useEffect(() => {
        if (scrollRef.current && !isPaused) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [requests, isPaused]);

    const clearLogs = () => setRequests([]);

    if (!isVisible) return null;

    if (minimized) {
        return (
            <div className="fixed bottom-4 right-4 z-[9999]">
                <button
                    onClick={() => setMinimized(false)}
                    className="bg-black/80 text-white p-3 rounded-full shadow-lg hover:bg-black transition-all flex items-center gap-2 animate-pulse"
                >
                    <Activity size={20} className="text-emerald-400" />
                    <span className="text-xs font-bold">{requests.length}</span>
                </button>
            </div>
        );
    }

    const filteredRequests = requests.filter(r =>
        r.url.toLowerCase().includes(filter.toLowerCase()) ||
        r.method.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[400px] bg-black/90 text-white rounded-xl shadow-2xl z-[9999] flex flex-col border border-gray-800 font-mono text-xs overflow-hidden transition-all duration-300">

            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400" />
                    <span className="font-bold text-gray-200">Network Spy</span>
                    <span className="bg-gray-800 px-1.5 py-0.5 rounded text-[10px] text-gray-400">{requests.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsPaused(!isPaused)} className={`p-1.5 rounded hover:bg-gray-800 ${isPaused ? 'text-amber-400' : 'text-gray-400'}`} title={isPaused ? "Resume" : "Pause"}>
                        {isPaused ? <Play size={12} /> : <Pause size={12} />}
                    </button>
                    <button onClick={clearLogs} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-red-400" title="Clear">
                        <Trash2 size={12} />
                    </button>
                    <button onClick={() => setMinimized(true)} className="p-1.5 rounded hover:bg-gray-800 text-gray-400" title="Minimize">
                        <div className="w-2.5 h-0.5 bg-current rounded-full" />
                    </button>
                    <button onClick={() => setIsVisible(false)} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white" title="Close">
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-2 bg-gray-900/50 flex gap-2 border-b border-gray-800">
                <div className="relative flex-1">
                    <Filter size={10} className="absolute left-2 top-2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Filter url..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded py-1 pl-6 pr-2 text-gray-300 focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                    />
                </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700" ref={scrollRef}>
                {filteredRequests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 italic">
                        <span>Waiting for traffic...</span>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <div key={req.id} className="group flex items-start gap-2 p-1.5 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-emerald-500">
                            <span className="text-gray-500 whitespace-nowrap min-w-[50px]">{req.timestamp}</span>
                            <span className={`font-bold w-10 ${req.method === 'GET' ? 'text-blue-400' :
                                req.method === 'POST' ? 'text-green-400' :
                                    req.method === 'PUT' ? 'text-orange-400' :
                                        req.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
                                }`}>{req.method}</span>
                            <span className="text-gray-300 break-all">{req.url}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NetworkDebugger;
