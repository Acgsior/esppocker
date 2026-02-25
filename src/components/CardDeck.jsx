import React from 'react';
import { useRoom } from '../context/RoomContext';

export default function CardDeck() {
    const { currentRoom, currentUser, submitVote } = useRoom();

    if (!currentRoom || !currentUser) return null;

    const options = currentRoom.voting_options || [];
    const currentVote = currentUser.vote;
    const isRevealed = currentRoom.status === 'revealed';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Your Cards</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {isRevealed ? 'Round finished.' : 'Select a card to drop your vote.'}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2 scale-105'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300'
                                }
              `}
                        >
                            <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
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
    );
}
