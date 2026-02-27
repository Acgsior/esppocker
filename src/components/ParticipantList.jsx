import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Check, Loader2, Eye, Users } from 'lucide-react';

export default function ParticipantList() {
    const { participants, currentUser, currentRoom, actionBubble, hoveredVote } = useRoom();

    const isRevealed = currentRoom?.status === 'revealed';

    // Split voters and observers
    const voters = participants.filter(p => !p.is_observer);
    const observers = participants.filter(p => p.is_observer);

    // Calculate stats
    const votedParticipants = voters.filter(p => p.vote !== null);
    const totalParticipants = voters.length;
    const votedCount = votedParticipants.length;

    // Determine the highest vote(s)
    let highestVotes = new Set();
    if (isRevealed && votedCount > 0) {
        const counts = {};
        votedParticipants.forEach(p => {
            counts[p.vote] = (counts[p.vote] || 0) + 1;
        });
        const maxCount = Math.max(...Object.values(counts));
        highestVotes = new Set(Object.keys(counts).filter(k => counts[k] === maxCount));
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-stone-800">The Table</h2>
                <div className="flex justify-between items-center mt-2">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Voters
                    </h3>
                    <span className="text-sm font-medium bg-stone-100 text-stone-600 py-1 px-3 rounded-full">
                        {votedCount} / {totalParticipants} Voted
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {voters.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-stone-500 text-sm">
                        Waiting for players to join...
                    </div>
                ) : (
                    voters.map((participant) => {
                        const hasVoted = participant.vote !== null;
                        const isHighest = isRevealed && hasVoted && highestVotes.has(participant.vote);
                        const isHovered = isRevealed && hoveredVote !== null && hoveredVote === participant.vote;
                        const isCurrentUser = currentUser?.id === participant.id;

                        return (
                            <div
                                key={participant.id}
                                className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-500 ${isHovered
                                    ? 'border-coffee-300 bg-coffee-100 shadow-md shadow-coffee-200/50 -translate-y-1 scale-105 z-10'
                                    : isHighest
                                        ? 'border-coffee-300 bg-coffee-50'
                                        : hasVoted
                                            ? 'border-coffee-100 bg-coffee-50/30'
                                            : 'border-dashed border-stone-200 bg-stone-50/50'
                                    } ${isCurrentUser ? 'ring-2 ring-coffee-500 ring-offset-2' : ''}`}
                            >
                                {/* The "Card" on the table */}
                                <div
                                    className={`w-12 h-16 rounded-md shadow-sm mb-3 flex items-center justify-center transition-all duration-500 ${isRevealed && hasVoted
                                        ? (isHighest ? 'bg-coffee-500 shadow-coffee-300 shadow-lg ring-2 ring-coffee-400 ring-offset-2 [transform:rotateY(180deg)]' : 'bg-coffee-600 [transform:rotateY(180deg)] opacity-80')
                                        : hasVoted ? 'bg-coffee-200 border-2 border-coffee-300' :
                                            'bg-white border border-stone-200'
                                        }`}
                                    style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                                >
                                    {isRevealed && hasVoted ? (
                                        <div className={`font-bold select-none transition-all duration-500 tracking-tight ${isHighest
                                                ? (participant.vote.length > 3 ? 'text-white text-xl drop-shadow-md' : 'text-white text-2xl drop-shadow-md')
                                                : (participant.vote.length > 3 ? 'text-stone-200 text-base' : 'text-stone-200 text-lg')
                                            }`} style={{ transform: 'rotateY(180deg)' }}>
                                            {participant.vote}
                                        </div>
                                    ) : hasVoted ? (
                                        <Check className="w-5 h-5 text-coffee-500" />
                                    ) : (
                                        <Loader2 className="w-4 h-4 text-stone-300 animate-spin" />
                                    )}
                                </div>

                                {/* Participant Name */}
                                <span className="text-sm font-medium text-stone-700 truncate w-full text-center">
                                    {participant.name} {isCurrentUser && <span className="text-coffee-600 font-bold ml-1">(You)</span>}
                                </span>

                                {/* Status indicator pill */}
                                <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 px-2 py-0.5 rounded-full transition-colors duration-500 ${isRevealed
                                    ? (isHighest ? 'text-orange-800 bg-orange-200 shadow-sm' : (hasVoted ? 'text-stone-500 bg-stone-100' : 'text-stone-400 bg-stone-100 opacity-50'))
                                    : (hasVoted ? 'text-coffee-600 bg-coffee-100' : 'text-stone-500 bg-stone-200 animate-pulse')
                                    }`}>
                                    {isRevealed
                                        ? (isHighest ? 'Top Pick' : (hasVoted ? 'Voted' : 'Skipped'))
                                        : (hasVoted ? 'Ready' : 'Thinking')
                                    }
                                </span>

                                {/* Action Bubble */}
                                {actionBubble?.userId === participant.id && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 animate-float-up pointer-events-none drop-shadow-md">
                                        <div className={`text-white text-xs font-bold px-3 py-1.5 rounded-2xl shadow-lg relative flex items-center gap-1.5 whitespace-nowrap ${actionBubble.type === 'start' ? 'bg-coffee-800' : 'bg-orange-500'}`}>
                                            {actionBubble.type === 'start' ? (
                                                <><span className="text-sm">🔄</span><span>Start New!</span></>
                                            ) : (
                                                <><span className="text-sm">🤘</span><span>Open!</span></>
                                            )}
                                            <div className={`absolute w-2 h-2 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2 rounded-sm clip-bottom ${actionBubble.type === 'start' ? 'bg-coffee-800' : 'bg-orange-500'}`}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {observers.length > 0 && (
                <div className="mt-8 pt-6 border-t border-stone-100">
                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        Observers
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {observers.map(observer => {
                            const isCurrentUser = currentUser?.id === observer.id;
                            return (
                                <div key={observer.id} className={`relative flex items-center bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 ${isCurrentUser ? 'ring-2 ring-coffee-500' : ''}`}>
                                    <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center mr-2">
                                        <span className="text-xs font-bold text-stone-600">{observer.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span className="text-sm font-medium text-stone-700">
                                        {observer.name} {isCurrentUser && <span className="text-coffee-600 font-bold ml-1">(You)</span>}
                                    </span>

                                    {/* Action Bubble for Observers */}
                                    {actionBubble?.userId === observer.id && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 animate-float-up pointer-events-none drop-shadow-md">
                                            <div className={`text-white text-xs font-bold px-3 py-1.5 rounded-2xl shadow-lg relative flex items-center gap-1.5 whitespace-nowrap ${actionBubble.type === 'start' ? 'bg-coffee-800' : 'bg-orange-500'}`}>
                                                {actionBubble.type === 'start' ? (
                                                    <><span className="text-sm">🔄</span><span>Start New!</span></>
                                                ) : (
                                                    <><span className="text-sm">🤘</span><span>Open!</span></>
                                                )}
                                                <div className={`absolute w-2 h-2 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2 rounded-sm clip-bottom ${actionBubble.type === 'start' ? 'bg-coffee-800' : 'bg-orange-500'}`}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
