import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Eye, EyeOff } from 'lucide-react';

export default function CardDeck() {
    const { currentRoom, currentUser, submitVote } = useRoom();
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    if (!currentRoom || !currentUser) return null;

    if (currentUser.is_observer) {
        return (
            <div className="bg-surface-card rounded-xl shadow-sm border border-hairline p-4 lg:sticky lg:top-8 text-center flex items-center justify-center space-x-3">
                <div className="bg-canvas p-2 rounded-full border border-hairline flex-shrink-0">
                    <Eye className="w-5 h-5 text-muted-soft" />
                </div>
                <div className="text-left">
                    <h2 className="text-base font-bold text-ink">Spectator Mode</h2>
                    <p className="text-xs text-muted">You are observing this room.</p>
                </div>
            </div>
        );
    }

    const options = currentRoom.voting_options || [];
    const isRevealed = currentRoom.status === 'revealed';
    // Clear visual selection when the room is revealed
    const currentVote = isRevealed ? null : currentUser.vote;

    return (
        <div className="bg-surface-card rounded-2xl shadow-sm border border-hairline p-6 sticky top-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-ink">Your Cards</h2>
                    <div className="relative mt-1">
                        <p className="text-sm text-transparent select-none pointer-events-none" aria-hidden="true">
                            Select a card to drop your vote.
                        </p>
                        <p className="text-sm text-muted absolute inset-0">
                            {isRevealed ? 'Round finished.' : 'Select a card to drop your vote.'}
                        </p>
                    </div>
                </div>

                {/* Privacy Mode Switch */}
                <button
                    onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isPrivacyMode ? 'bg-surface-dark text-on-dark border-surface-dark' : 'bg-canvas text-body-strong border-hairline hover:bg-surface-soft'}`}
                    title="Toggle Privacy Mode"
                >
                    {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Privacy</span>
                </button>
            </div>

            <div className="group relative -mx-2 -mb-2 p-2">
                {/* Blurred Overlay when not hovered */}
                {isPrivacyMode && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface-card/95 backdrop-blur-xl opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none rounded-xl">
                        <span className="bg-surface-dark text-on-dark text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 ">
                            <Eye className="w-4 h-4" /> Hover to reveal
                        </span>
                    </div>
                )}

                <div className={`grid grid-cols-3 landscape:max-lg:flex landscape:max-lg:flex-nowrap landscape:max-lg:overflow-x-auto landscape:max-lg:gap-2 landscape:max-lg:pt-4 landscape:max-lg:pb-6 landscape:max-lg:-mx-2 landscape:max-lg:px-2 gap-3 transition-all duration-300 ${isPrivacyMode ? 'group-hover:opacity-100 opacity-0 select-none' : ''}`}>
                    {options.map((option) => {
                        const isSelected = currentVote === option;
                        const isCustomRange = typeof option === 'string' && option.includes('-');

                        return (
                            <button
                                key={option}
                                disabled={isRevealed}
                                onClick={() => submitVote(option)}
                                className={`
                relative aspect-[3/4] flex items-center justify-center rounded-xl p-2 transition-all duration-200
                landscape:max-lg:flex-1 landscape:max-lg:min-w-[40px] landscape:max-lg:max-w-[72px] landscape:max-lg:p-1 landscape:max-lg:rounded-lg
                ${isRevealed ? 'cursor-not-allowed opacity-50 grayscale' : 'hover:-translate-y-2 hover:shadow-md cursor-pointer'}
                ${isSelected
                                        ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-200 dark:shadow-none ring-2 ring-coffee-600 ring-offset-2 dark:ring-offset-surface-card scale-105'
                                        : 'bg-surface-card border-2 border-hairline text-body-strong hover:border-coffee-300 dark:hover:border-coffee-600'
                                    }
              `}
                            >
                                <span className={`font-bold landscape:max-lg:text-base ${isSelected ? 'text-white' : 'text-ink'}`}>
                                    {isCustomRange ? (
                                        <div className="flex flex-col items-center justify-center leading-[1.1] text-base">
                                            <span>{option.split('-')[0]}</span>
                                            <span className="text-[0.6em] opacity-50 my-0.5">-</span>
                                            <span>{option.split('-')[1]}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xl">{option}</span>
                                    )}
                                </span>

                                {/* Decorative corners */}
                                {!isCustomRange && (
                                    <>
                                        <span className={`absolute top-2 left-2 text-[10px] landscape:max-lg:text-[8px] font-medium opacity-50 ${isSelected ? 'text-white' : ''}`}>
                                            {option}
                                        </span>
                                        <span className={`absolute bottom-2 right-2 text-[10px] landscape:max-lg:text-[8px] font-medium opacity-50 rotate-180 ${isSelected ? 'text-white' : ''}`}>
                                            {option}
                                        </span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
