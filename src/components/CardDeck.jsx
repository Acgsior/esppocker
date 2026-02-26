import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Eye, EyeOff } from 'lucide-react';

export default function CardDeck() {
    const { currentRoom, currentUser, submitVote } = useRoom();
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    if (!currentRoom || !currentUser) return null;

    const options = currentRoom.voting_options || [];
    const isRevealed = currentRoom.status === 'revealed';
    // Clear visual selection when the room is revealed
    const currentVote = isRevealed ? null : currentUser.vote;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sticky top-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-stone-800">Your Cards</h2>
                    <div className="relative mt-1">
                        <p className="text-sm text-transparent select-none pointer-events-none" aria-hidden="true">
                            Select a card to drop your vote.
                        </p>
                        <p className="text-sm text-stone-500 absolute inset-0">
                            {isRevealed ? 'Round finished.' : 'Select a card to drop your vote.'}
                        </p>
                    </div>
                </div>

                {/* Privacy Mode Switch */}
                <button
                    onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isPrivacyMode ? 'bg-stone-800 text-white border-stone-800' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'}`}
                    title="Toggle Privacy Mode"
                >
                    {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Privacy</span>
                </button>
            </div>

            <div className="group relative -mx-2 -mb-2 p-2">
                {/* Blurred Overlay when not hovered */}
                {isPrivacyMode && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 backdrop-blur-xl opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none rounded-xl">
                        <span className="bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                            <Eye className="w-4 h-4" /> Hover to reveal
                        </span>
                    </div>
                )}

                <div className={`grid grid-cols-3 gap-3 transition-all duration-300 ${isPrivacyMode ? 'group-hover:opacity-100 opacity-0 select-none' : ''}`}>
                    {options.map((option) => {
                        const isSelected = currentVote === option;

                        return (
                            <button
                                key={option}
                                disabled={isRevealed}
                                onClick={() => submitVote(option)}
                                className={`
                relative aspect-[3/4] flex items-center justify-center rounded-xl p-2 transition-all duration-200
                ${isRevealed ? 'cursor-not-allowed opacity-50 grayscale' : 'hover:-translate-y-2 hover:shadow-md cursor-pointer'}
                ${isSelected
                                        ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-200 ring-2 ring-coffee-600 ring-offset-2 scale-105'
                                        : 'bg-white border-2 border-stone-200 text-stone-700 hover:border-coffee-300'
                                    }
              `}
                            >
                                <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                                    {option}
                                </span>

                                {/* Decorative corners */}
                                <span className={`absolute top-2 left-2 text-[10px] font-medium opacity-50 ${isSelected ? 'text-white' : ''}`}>
                                    {option}
                                </span>
                                <span className={`absolute bottom-2 right-2 text-[10px] font-medium opacity-50 rotate-180 ${isSelected ? 'text-white' : ''}`}>
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
