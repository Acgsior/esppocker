import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGrooming } from '../context/GroomingContext';
import PointDeck from '../components/PointDeck';
import ParticipantList from '../components/ParticipantList';
import GroomingControls from '../components/GroomingControls';
import VoteResults from '../components/VoteResults';
import CoffeeIcon from '../components/CoffeeIcon';
import { User, LogOut, RefreshCw, Copy, Check, Eye, RotateCcw } from 'lucide-react';

const PRESET_NAMES = [
    'Ajay',
    'Brita',
    'Damon',
    'Francis',
    'Joe',
    'John',
    'Kevin',
    'Liam',
    'Morgan',
    'Palak',
    'Terence',
    'Weber',
    'Xueqin',
    'Yina',
    'Zhichao'
];

export default function GroomingBoard() {
    const { id: groomingId } = useParams();
    const navigate = useNavigate();
    const { currentGrooming, currentUser, loadGroomingData, checkSession, joinGrooming, leaveGrooming, broadcastRefresh, error, participants, revealCards, startNewVoting } = useGrooming();
    const [nickname, setNickname] = useState(() => {
        const match = document.cookie.match(/(?:^|; )grooming_last_used_name=([^;]+)/) || document.cookie.match(/(?:^|; )poker_last_used_name=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    });
    const [isObserver, setIsObserver] = useState(false);
    const [joining, setJoining] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const initGrooming = async () => {
            await loadGroomingData(groomingId);
            await checkSession(groomingId);
            setIsReady(true);
        };

        initGrooming();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groomingId]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        setJoining(true);
        await joinGrooming(groomingId, nickname.trim(), isObserver);
        setJoining(false);
    };

    const handleLeave = async () => {
        if (currentUser) {
            await leaveGrooming(currentUser.id);
        }
        document.cookie = `grooming_user_${groomingId}=; path=/; max-age=0;`;
        document.cookie = 'grooming_nickname=; path=/; max-age=0;';
        navigate('/');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadGroomingData(groomingId);
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-canvas/50">
                <div className="relative flex justify-center items-center">
                    <div className="absolute animate-ping w-24 h-24 rounded-full bg-coffee-200 dark:bg-coffee-800 opacity-60"></div>
                    <div className="relative flex items-center justify-center w-24 h-24 bg-surface-card rounded-full shadow-lg border-4 border-coffee-500 dark:border-coffee-600 transform transition-transform hover:scale-110">
                        <CoffeeIcon className="w-12 h-12 mt-1 animate-bounce" />
                    </div>
                </div>
                <h2 className="mt-8 text-2xl font-bold text-ink animate-pulse tracking-wide">Brewing your session...</h2>
                <p className="mt-3 text-muted font-medium tracking-wide">Please wait while we set up the table</p>
            </div>
        );
    }

    if (error || !currentGrooming) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-canvas/50">
                <div className="bg-surface-card p-8 rounded-2xl shadow-xl max-w-md w-full border border-hairline">
                    <div className="w-16 h-16 bg-coffee-100 dark:bg-coffee-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CoffeeIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-ink mb-3">Grooming not found</h2>
                    <p className="text-body-strong leading-relaxed">
                        {error || "The session you are looking for doesn't exist or has been removed."}
                    </p>
                </div>
            </div>
        );
    }

    // Not joined yet
    if (!currentUser) {
        return (
            <div className="max-w-md w-full mx-auto mt-20 p-8 bg-surface-card rounded-xl shadow-lg border border-hairline">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">Join Grooming</h1>
                    <p className="text-coffee-600 dark:text-coffee-400 font-medium">{currentGrooming.name}</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-body-strong mb-1">
                            Your Name
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-muted-soft" />
                            </div>
                            <input
                                id="nickname"
                                type="text"
                                list="preset-names"
                                required
                                placeholder="Select or enter your name"
                                className="w-full pl-10 pr-10 py-3 rounded-lg border border-hairline focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 transition-colors outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 bg-transparent"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                            />
                            {/* Custom caret icon appearing behind the invisible native invisible indicator */}
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-soft">
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

                    <div className="flex items-center justify-between mt-4 p-3 bg-surface-soft rounded-lg border border-hairline">
                        <div className="flex items-center text-sm text-body-strong select-none">
                            <Eye className="w-4 h-4 mr-2 text-muted-soft" />
                            <div>
                                <p className="font-medium">Join as Observer</p>
                                <p className="text-xs text-muted">You won't participate in voting</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isObserver}
                            onClick={() => setIsObserver(!isObserver)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:ring-offset-2 ${isObserver ? 'bg-coffee-600' : 'bg-hairline'
                                }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-canvas shadow ring-0 transition duration-200 ease-in-out ${isObserver ? 'translate-x-5' : 'translate-x-0'
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
                                <CoffeeIcon className="w-6 h-6 mr-2 animate-bounce" />
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

            {/* Floating Action Button (Mobile Only) */}
            <div className="fixed bottom-6 right-6 z-50 lg:hidden">
                <button
                    onClick={() => {
                        if (currentGrooming.status === 'revealed') {
                            startNewVoting(currentGrooming.id);
                        } else {
                            if (participants && participants.length > 0 && participants.some(p => p.vote !== null && p.vote !== undefined)) {
                                revealCards(currentGrooming.id);
                            }
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
