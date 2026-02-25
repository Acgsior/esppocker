import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { Settings, Play } from 'lucide-react';

const VOTING_TEMPLATES = {
    FIBONACCI: ['0', '1', '2', '3', '5', '8', '13', 'Skip'],
    TSHIRT: ['XSS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Skip'],
};

export default function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [template, setTemplate] = useState('FIBONACCI');
    const [customOptions, setCustomOptions] = useState('');
    const { createRoom, loading, error } = useRoom();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) return;

        let optionsToUse;
        if (template === 'CUSTOM') {
            optionsToUse = customOptions.split(',').map(opt => opt.trim()).filter(Boolean);
            if (optionsToUse.length === 0) optionsToUse = VOTING_TEMPLATES.FIBONACCI; // Fallback
        } else {
            optionsToUse = VOTING_TEMPLATES[template];
        }

        const roomId = await createRoom(roomName, optionsToUse);
        if (roomId) {
            navigate(`/room/${roomId}`);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Agile Poker</h1>
                <p className="text-gray-500">Free, fast, real-time estimations.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                        Room Name
                    </label>
                    <input
                        id="roomName"
                        type="text"
                        required
                        placeholder="e.g. Sprint 42 Planning"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Settings className="w-4 h-4 mr-1 text-gray-400" />
                        Voting Template
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name="template"
                                value="FIBONACCI"
                                checked={template === 'FIBONACCI'}
                                onChange={() => setTemplate('FIBONACCI')}
                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-gray-900">Fibonacci</span>
                                <span className="block text-xs text-gray-500">0, 1, 2, 3, 5, 8, 13</span>
                            </div>
                        </label>

                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="radio"
                                name="template"
                                value="TSHIRT"
                                checked={template === 'TSHIRT'}
                                onChange={() => setTemplate('TSHIRT')}
                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-medium text-gray-900">T-Shirt Size</span>
                                <span className="block text-xs text-gray-500">XXS, XS, S, M, L, XL, XXL, XXXL</span>
                            </div>
                        </label>

                        <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center h-5 mt-1">
                                <input
                                    type="radio"
                                    name="template"
                                    value="CUSTOM"
                                    checked={template === 'CUSTOM'}
                                    onChange={() => setTemplate('CUSTOM')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="ml-3 w-full">
                                <span className="block text-sm font-medium text-gray-900 mb-1">Custom Options</span>
                                {template === 'CUSTOM' && (
                                    <input
                                        type="text"
                                        placeholder="1, 2, 3, ?, Break"
                                        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none mt-1"
                                        value={customOptions}
                                        onChange={(e) => setCustomOptions(e.target.value)}
                                        required={template === 'CUSTOM'}
                                    />
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
                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
