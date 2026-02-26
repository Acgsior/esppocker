import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Check, Loader2 } from 'lucide-react';

export default function ParticipantList() {
    const { participants, currentRoom, revealerId } = useRoom();

    const isRevealed = currentRoom?.status === 'revealed';

    // Calculate stats
    const totalParticipants = participants.length;
    const votedCount = participants.filter(p => p.vote !== null).length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">The Table</h2>
                <span className="text-sm font-medium bg-gray-100 text-gray-600 py-1 px-3 rounded-full">
                    {votedCount} / {totalParticipants} Voted
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {participants.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-gray-500 text-sm">
                        Waiting for players to join...
                    </div>
                ) : (
                    participants.map((participant) => {
                        const hasVoted = participant.vote !== null;

                        return (
                            <div
                                key={participant.id}
                                className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${hasVoted
                                    ? 'border-indigo-100 bg-indigo-50/30'
                                    : 'border-dashed border-gray-200 bg-gray-50/50'
                                    }`}
                            >
                                {/* The "Card" on the table */}
                                <div
                                    className={`w-12 h-16 rounded-md shadow-sm mb-3 flex items-center justify-center transition-all duration-500 ${isRevealed && hasVoted ? 'bg-indigo-600 [transform:rotateY(180deg)]' :
                                        hasVoted ? 'bg-indigo-200 border-2 border-indigo-300' :
                                            'bg-white border border-gray-200'
                                        }`}
                                    style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                                >
                                    {isRevealed && hasVoted ? (
                                        <div className="text-white font-bold text-lg select-none" style={{ transform: 'rotateY(180deg)' }}>
                                            {participant.vote}
                                        </div>
                                    ) : hasVoted ? (
                                        <Check className="w-5 h-5 text-indigo-500" />
                                    ) : (
                                        <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                                    )}
                                </div>

                                {/* Participant Name */}
                                <span className="text-sm font-medium text-gray-700 truncate w-full text-center">
                                    {participant.name}
                                </span>

                                {/* Status indicator pill */}
                                <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 px-2 py-0.5 rounded-full ${hasVoted ? 'text-indigo-600 bg-indigo-100' : 'text-gray-500 bg-gray-200'
                                    }`}>
                                    {hasVoted ? 'Ready' : 'Thinking'}
                                </span>

                                {/* Reveal Action Bubble */}
                                {revealerId === participant.id && (
                                    <div className="absolute -top-10 right-0 z-10 animate-float-up pointer-events-none drop-shadow-md">
                                        <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-2xl shadow-lg relative flex items-center gap-1.5">
                                            <span className="text-sm">🤘</span><span>Open!</span>
                                            <div className="absolute w-2 h-2 bg-indigo-600 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2 rounded-sm clip-bottom"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
