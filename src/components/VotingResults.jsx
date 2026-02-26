import React from 'react';
import { useRoom } from '../context/RoomContext';

export default function VotingResults() {
    const { participants, currentRoom, setHoveredVote } = useRoom();

    if (!currentRoom || currentRoom.status !== 'revealed') return null;

    const votedParticipants = participants.filter(p => p.vote !== null);
    const totalVotes = votedParticipants.length;

    if (totalVotes === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
                <h3 className="text-xl font-bold text-stone-800 mb-4">Voting Results</h3>
                <p className="text-stone-500 text-sm">No votes to display.</p>
            </div>
        );
    }

    // Count votes
    const voteCounts = {};
    votedParticipants.forEach(p => {
        voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
    });

    // Create array and sort by count descending
    const results = Object.entries(voteCounts)
        .map(([vote, count]) => ({
            vote,
            count,
            percentage: Math.round((count / totalVotes) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    const maxCount = results.length > 0 ? results[0].count : 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            <h3 className="text-xl font-bold text-stone-800 mb-6">Voting Results</h3>
            <div className="space-y-4">
                {results.map(item => {
                    const isHighest = item.count === maxCount;
                    // Using orange to represent the highest score highlight
                    const badgeColor = isHighest ? 'bg-orange-100 text-orange-800' : 'bg-coffee-100 text-coffee-800';
                    const barColor = isHighest ? 'bg-orange-500' : 'bg-coffee-500';

                    return (
                        <div
                            key={item.vote}
                            onMouseEnter={() => setHoveredVote && setHoveredVote(item.vote)}
                            onMouseLeave={() => setHoveredVote && setHoveredVote(null)}
                            className="p-3 -mx-3 rounded-xl hover:bg-stone-50 transition-colors duration-200 cursor-default"
                        >
                            <div className="flex justify-between items-center mb-2 text-sm font-medium text-stone-700">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-block px-2.5 py-1 rounded-md font-bold min-w-[2.5rem] text-center shadow-sm ${badgeColor}`}>
                                        {item.vote}
                                    </span>
                                </div>
                                <span className="text-stone-900 font-bold ml-2">
                                    {item.count} <span className="font-normal text-stone-500 text-xs mr-1">vote{item.count !== 1 ? 's' : ''}</span>
                                    <span className="text-coffee-700">({item.percentage}%)</span>
                                </span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className={`${barColor} h-3 rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
