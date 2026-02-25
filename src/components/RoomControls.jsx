import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Eye, RotateCcw } from 'lucide-react';

export default function RoomControls() {
    const { currentRoom, participants, revealCards, startNewVoting } = useRoom();

    if (!currentRoom) return null;

    const isRevealed = currentRoom.status === 'revealed';
    const hasVotes = participants && participants.length > 0 && participants.some(p => p.vote !== null && p.vote !== undefined);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h3 className="font-semibold text-gray-900">Room Controls</h3>
                <p className="text-sm text-gray-500">Manage the current voting round.</p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
                {!isRevealed ? (
                    <button
                        onClick={() => revealCards(currentRoom.id)}
                        disabled={!hasVotes}
                        className="flex-1 sm:flex-none flex items-center justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Reveal Cards
                    </button>
                ) : (
                    <button
                        onClick={() => startNewVoting(currentRoom.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center py-2.5 px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Start New Voting
                    </button>
                )}
            </div>
        </div>
    );
}
