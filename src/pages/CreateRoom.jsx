import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { Settings, Play } from 'lucide-react';

const VOTING_TEMPLATES = {
    FIBONACCI: ['0', '0.5', '1', '2', '3', '5', '8', '13', 'Skip'],
    TSHIRT: ['XSS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Skip'],
};

export default function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [template, setTemplate] = useState('FIBONACCI');
    const [customStart, setCustomStart] = useState('1');
    const [customMax, setCustomMax] = useState('10');
    const [customStep, setCustomStep] = useState('1');
    const { createRoom, loading, error } = useRoom();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) return;

        let optionsToUse = [];
        if (template === 'CUSTOM') {
            const start = parseFloat(customStart);
            const max = parseFloat(customMax);
            const step = parseFloat(customStep);
            
            if (!isNaN(start) && !isNaN(max) && !isNaN(step) && step > 0 && start < max) {
                // To avoid floating point precision issues, we limit decimals
                let current = start;
                while (current < max) {
                    let next = current + step;
                    if (next > max) next = max;
                    optionsToUse.push(`${Number(current.toFixed(2))}-${Number(next.toFixed(2))}`);
                    current = next;
                }
            }
            if (optionsToUse.length === 0) optionsToUse = VOTING_TEMPLATES.FIBONACCI; // Fallback
            else optionsToUse.push('Skip'); // Default append skip for standard behaviors
        } else {
            optionsToUse = VOTING_TEMPLATES[template];
        }

        const roomId = await createRoom(roomName, optionsToUse);
        if (roomId) {
            navigate(`/room/${roomId}`);
        }
    };

    return (
        <div className="max-w-lg w-full mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-stone-100">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">Espresso Grooming Poker v3</h1>
                <p className="text-stone-500">FOR Roadmap Team 1</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="roomName" className="block text-sm font-medium text-stone-700 mb-1">
                        Room Name
                    </label>
                    <input
                        id="roomName"
                        type="text"
                        required
                        placeholder="e.g. Sprint 42 Planning"
                        className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 transition-colors outline-none"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-3 flex items-center">
                        <Settings className="w-4 h-4 mr-1 text-stone-400" />
                        Voting Template
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                            <input
                                type="radio"
                                name="template"
                                value="FIBONACCI"
                                checked={template === 'FIBONACCI'}
                                onChange={() => setTemplate('FIBONACCI')}
                                className="w-4 h-4 text-coffee-600 border-stone-300 focus:ring-coffee-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-stone-900">Fibonacci</span>
                                <span className="block text-xs text-stone-500">0, 0.5, 1, 2, 3, 5, 8, 13</span>
                            </div>
                        </label>

                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                            <input
                                type="radio"
                                name="template"
                                value="TSHIRT"
                                checked={template === 'TSHIRT'}
                                onChange={() => setTemplate('TSHIRT')}
                                className="w-4 h-4 text-coffee-600 border-stone-300 focus:ring-coffee-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-stone-900">T-Shirt Size</span>
                                <span className="block text-xs text-stone-500">XXS, XS, S, M, L, XL, XXL, XXXL</span>
                            </div>
                        </label>

                        <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                            <div className="flex items-center h-5 mt-1">
                                <input
                                    type="radio"
                                    name="template"
                                    value="CUSTOM"
                                    checked={template === 'CUSTOM'}
                                    onChange={() => setTemplate('CUSTOM')}
                                    className="w-4 h-4 text-coffee-600 border-stone-300 focus:ring-coffee-500"
                                />
                            </div>
                            <div className="ml-3 w-full">
                                <span className="block text-sm font-medium text-stone-900 mb-1">Custom Range</span>
                                <span className="block text-xs text-stone-500 mb-2">Generate a sequence by start, max, and step amounts</span>
                                {template === 'CUSTOM' && (
                                    <div className="space-y-3 mt-2 pr-3">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs text-stone-500 mb-1">Start</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-1 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
                                                    value={customStart}
                                                    onChange={(e) => setCustomStart(e.target.value)}
                                                    required={template === 'CUSTOM'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-stone-500 mb-1">Max</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-1 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
                                                    value={customMax}
                                                    onChange={(e) => setCustomMax(e.target.value)}
                                                    required={template === 'CUSTOM'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-stone-500 mb-1">Step</label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    className="w-full px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-1 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
                                                    value={customStep}
                                                    onChange={(e) => setCustomStep(e.target.value)}
                                                    required={template === 'CUSTOM'}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Preview */}
                                        <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
                                            <span className="block text-xs font-bold text-stone-500 mb-1 tracking-wider uppercase">Preview</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(() => {
                                                    const s = parseFloat(customStart);
                                                    const m = parseFloat(customMax);
                                                    const st = parseFloat(customStep);
                                                    const items = [];
                                                    if (!isNaN(s) && !isNaN(m) && !isNaN(st) && st > 0 && s < m) {
                                                        let c = s;
                                                        while (c < m && items.length < 50) { // arbitrary limit for preview
                                                            let next = c + st;
                                                            if (next > m) next = m;
                                                            items.push(`${Number(c.toFixed(2))}-${Number(next.toFixed(2))}`);
                                                            c = next;
                                                        }
                                                    }
                                                    return items.length > 0 ? (
                                                        <>
                                                            {items.slice(0, 10).map((v, i) => (
                                                                <span key={i} className="inline-block px-2 py-0.5 bg-white border border-stone-200 rounded text-xs text-stone-600 font-medium shadow-sm">{v}</span>
                                                            ))}
                                                            {items.length > 10 && <span className="inline-block px-2 py-0.5 text-xs text-stone-400 font-medium">... ({items.length} total)</span>}
                                                        </>
                                                    ) : <span className="text-xs text-stone-400">Invalid range</span>;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !roomName.trim()}
                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-coffee-600 hover:bg-coffee-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coffee-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? (
                        <span className="animate-pulse flex items-center text-lg font-bold">
                            <span className="animate-bounce mr-2">☕</span>
                            Brewing room...
                        </span>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Session
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
