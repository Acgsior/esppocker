import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrooming } from '../context/GroomingContext';
import PointDeck from './PointDeck';
import ParticipantList from './ParticipantList';
import GroomingControls from './GroomingControls';
import VoteResults from './VoteResults';
import { User, LogOut, RefreshCw, Copy, Check, Eye, RotateCcw } from 'lucide-react';

export default function ActiveGrooming() {
    const navigate = useNavigate();
    const { 
        currentGrooming, 
        currentUser, 
        leaveGrooming, 
        loadGroomingData, 
        broadcastRefresh, 
        participants, 
        revealCards, 
        startNewVoting 
    } = useGrooming();
    
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleLeave = async () => {
        await leaveGrooming(currentUser.id);
        document.cookie = `grooming_user_${currentGrooming.id}=; path=/; max-age=0;`;
        document.cookie = 'grooming_nickname=; path=/; max-age=0;';
        navigate('/');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadGroomingData(currentGrooming.id);
        broadcastRefresh();
        setIsRefreshing(false);
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto py-8 max-lg:py-2 px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 max-lg:mb-3 bg-surface-card p-4 rounded-xl shadow-sm border border-hairline">
                <div>
                    <h1 className="text-xl font-bold text-ink">{currentGrooming.name}</h1>
                    <div className="flex items-center text-sm font-medium text-body-strong mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${currentGrooming.status === 'voting' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
                        {currentGrooming.status === 'voting' ? 'Voting in progress' : 'Points revealed'}

                        <span className="mx-2 text-muted-soft">|</span>
                        <button
                            onClick={handleCopyUrl}
                            className={`flex items-center gap-1 transition-colors ${copied ? 'text-green-600' : 'text-muted hover:text-coffee-700'}`}
                            title="Copy Link"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-xs">{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden sm:flex items-center text-sm bg-surface-soft px-3 py-1.5 rounded-full border border-hairline">
                        <User className="w-4 h-4 mr-2 text-muted-soft" />
                        <span className="font-medium">{currentUser.name}</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 text-muted hover:text-coffee-700 hover:bg-coffee-50 rounded-lg transition-colors flex items-center"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline text-sm font-bold">Refresh</span>
                    </button>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                        title="Leave"
                    >
                        <LogOut className="w-5 h-5 sm:mr-1" />
                        <span className="hidden sm:inline text-sm font-bold">Leave</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 max-lg:gap-3 relative">
                <div className="lg:col-span-3 flex flex-col gap-8 max-lg:gap-3 relative">
                    {/* Sticky wrapper for GroomingControls on mobile */}
                    <div className="order-1 sticky top-0 z-20 -mx-4 px-4 max-lg:py-1 bg-canvas/95 backdrop-blur-sm lg:static lg:z-auto lg:mx-0 lg:p-0 lg:bg-transparent">
                        <GroomingControls />
                    </div>
                    <div className="order-3 lg:order-2">
                        <ParticipantList />
                    </div>
                    <div className="order-2 lg:order-3">
                        <VoteResults />
                    </div>
                </div>

                <div className="lg:col-span-1 order-last">
                    <PointDeck />
                </div>
            </div>

            <div className="fixed bottom-6 right-6 z-50 lg:hidden">
                <button
                    aria-label={currentGrooming.status === 'revealed' ? 'Start New Vote (Mobile)' : 'Reveal Points (Mobile)'}
                    onClick={() => {
                        if (currentGrooming.status === 'revealed') {
                            startNewVoting(currentGrooming.id);
                        } else {
                            revealCards(currentGrooming.id);
                        }
                    }}
                    disabled={currentGrooming.status !== 'revealed' && (!participants || participants.length === 0 || !participants.some(p => p.vote !== null && p.vote !== undefined))}
                    className={`p-4 rounded-full shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all ${currentGrooming.status === 'revealed' ? 'bg-coffee-800 hover:bg-coffee-900' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                    {currentGrooming.status === 'revealed' ? (
                        <RotateCcw className="w-6 h-6" />
                    ) : (
                        <Eye className="w-6 h-6" />
                    )}
                </button>
            </div>
        </div>
    );
}
