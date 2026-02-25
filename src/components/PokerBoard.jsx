import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import CardDeck from './CardDeck';
import ParticipantList from './ParticipantList';
import RoomControls from './RoomControls';
import { User, LogOut } from 'lucide-react';

export default function PokerBoard() {
    const { id: roomId } = useParams();
    const navigate = useNavigate();
    const { currentRoom, currentUser, loadRoomData, checkSession, joinRoom, loading, error } = useRoom();
    const [nickname, setNickname] = useState('');
    const [joining, setJoining] = useState(false);
    const [isReady, setIsReady] = useState(false);

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
        const success = await joinRoom(roomId, nickname.trim());
        setJoining(false);
    };

    const handleLeave = () => {
        localStorage.removeItem(`poker_user_${roomId}`);
        navigate('/');
    };

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
            <div className="max-w-md w-full mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Join Room</h1>
                    <p className="text-indigo-600 font-medium">{currentRoom.name}</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                            Your Nickname
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="nickname"
                                type="text"
                                required
                                placeholder="e.g. John Doe"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={joining || !nickname.trim()}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {joining ? 'Joining...' : 'Join Table'}
                    </button>
                </form>
            </div>
        );
    }

    // Active Poker Board
    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{currentRoom.name}</h1>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${currentRoom.status === 'voting' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
                        {currentRoom.status === 'voting' ? 'Voting in progress' : 'Cards revealed'}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center text-sm bg-gray-50 px-3 py-1.5 rounded-full border">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{currentUser.name}</span>
                    </div>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                        title="Leave Room"
                    >
                        <LogOut className="w-5 h-5 sm:mr-1" />
                        <span className="hidden sm:inline text-sm font-medium">Leave</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <ParticipantList />
                    <RoomControls />
                </div>

                <div className="lg:col-span-1">
                    <CardDeck />
                </div>
            </div>
        </div>
    );
}
