import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import CardDeck from '../components/CardDeck';
import ParticipantList from '../components/ParticipantList';
import RoomControls from '../components/RoomControls';
import VotingResults from '../components/VotingResults';
import { User, LogOut, RefreshCw, Copy, Check, Eye } from 'lucide-react';

const PRESET_NAMES = [
    'Alice',
    'Bob',
    'Charlie',
    'David',
    'Eve',
    'Frank',
    'Grace',
    'Heidi',
    'Ivan',
    'Judy'
];

export default function PokerBoard() {
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const { currentRoom, currentUser, loadRoomData, checkSession, joinRoom, leaveRoom, broadcastRefresh, loading, error } = useRoom();
    const [nickname, setNickname] = useState(() => {
        return localStorage.getItem('poker_last_used_name') || '';
    });
    const [isObserver, setIsObserver] = useState(false);
    const [joining, setJoining] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const initRoom = async () => {
            // First try to load the room to see if it even exists
            await loadRoomData(roomId);

            // Then check if user has a session for this specific room
            const hasSession = await checkSession(roomId);
            setIsReady(true);
        };

        initRoom();
    }, [roomId]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        setJoining(true);
        const success = await joinRoom(roomId, nickname.trim(), isObserver);
        setJoining(false);
    };

    const handleLeave = async () => {
        if (currentUser) {
            await leaveRoom(currentUser.id);
        }
        localStorage.removeItem(`poker_user_${roomId}`);
        document.cookie = 'poker_nickname=; path=/; max-age=0;';
        navigate('/');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadRoomData(roomId);
        broadcastRefresh();
        setIsRefreshing(false);
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50/50">
                <div className="relative flex justify-center items-center">
                    <div className="absolute animate-ping w-24 h-24 rounded-full bg-coffee-200 opacity-60"></div>
                    <div className="relative flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg border-4 border-coffee-500 text-4xl transform transition-transform hover:scale-110">
                        <span className="animate-bounce mt-2">☕</span>
                    </div>
                </div>
                <h2 className="mt-8 text-2xl font-bold text-stone-800 animate-pulse tracking-wide">Brewing your room...</h2>
                <p className="mt-3 text-stone-500 font-medium tracking-wide">Please wait while we set up the table</p>
            </div>
        );
    }

    if (error || !currentRoom) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md w-full border border-red-100">
                    <h2 className="text-xl font-bold mb-2">Room not found</h2>
                    <p className="mb-6">{error || "The room you are looking for doesn't exist or has been removed."}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // Not joined yet
    if (!currentUser) {
        return (
            <div className="max-w-md w-full mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-stone-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Join Room</h1>
                    <p className="text-coffee-600 font-medium">{currentRoom.name}</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-stone-700 mb-1">
                            Your Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-stone-400" />
                            </div>
                            <input
                                id="nickname"
                                type="text"
                                list="preset-names"
                                required
                                placeholder="Select or enter your name"
                                className="w-full pl-10 pr-10 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 transition-colors outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 bg-transparent"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                            />
                            {/* Custom caret icon appearing behind the invisible native invisible indicator */}
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </div>
                            <datalist id="preset-names">
                                {PRESET_NAMES.map(name => (
                                    <option key={name} value={name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                        <div className="flex items-center text-sm text-stone-700 select-none">
                            <Eye className="w-4 h-4 mr-2 text-stone-400" />
                            <div>
                                <p className="font-medium">Join as Observer</p>
                                <p className="text-xs text-stone-500">You won't participate in voting</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isObserver}
                            onClick={() => setIsObserver(!isObserver)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:ring-offset-2 ${isObserver ? 'bg-coffee-600' : 'bg-stone-300'
                                }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isObserver ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={joining || !nickname.trim()}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-coffee-600 hover:bg-coffee-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coffee-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {joining ? (
                            <span className="animate-pulse flex items-center text-lg font-bold">
                                <span className="animate-bounce mr-2">☕</span>
                                Taking a seat...
                            </span>
                        ) : 'Join Table'}
                    </button>
                </form>
            </div>
        );
    }

    // Active Poker Board
    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                <div>
                    <h1 className="text-xl font-bold text-stone-900">{currentRoom.name}</h1>
                    <div className="flex items-center text-sm font-medium text-stone-600 mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${currentRoom.status === 'voting' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
                        {currentRoom.status === 'voting' ? 'Voting in progress' : 'Cards revealed'}

                        <span className="mx-2 text-stone-300">|</span>
                        <button
                            onClick={handleCopyUrl}
                            className={`flex items-center gap-1 transition-colors ${copied ? 'text-green-600' : 'text-stone-500 hover:text-coffee-700'}`}
                            title="Copy Room Link"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-xs">{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center text-sm bg-stone-50 px-3 py-1.5 rounded-full border">
                        <User className="w-4 h-4 mr-2 text-stone-400" />
                        <span className="font-medium">{currentUser.name}</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 text-stone-500 hover:text-coffee-700 hover:bg-coffee-50 rounded-lg transition-colors flex items-center"
                        title="Refresh Room"
                    >
                        <RefreshCw className={`w-5 h-5 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline text-sm font-bold">Refresh</span>
                    </button>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                        title="Leave Room"
                    >
                        <LogOut className="w-5 h-5 sm:mr-1" />
                        <span className="hidden sm:inline text-sm font-bold">Leave</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <RoomControls />
                    <ParticipantList />
                    <VotingResults />
                </div>

                <div className="lg:col-span-1">
                    <CardDeck />
                </div>
            </div>
        </div>
    );
}
