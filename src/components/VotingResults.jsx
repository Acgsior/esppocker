import React from 'react';
import { useRoom } from '../context/RoomContext';

export default function VotingResults() {
    const { participants, currentRoom } = useRoom();

    if (!currentRoom || currentRoom.status !== 'revealed') return null;

    const votedParticipants = participants.filter(p => p.vote !== null);
    const totalVotes = votedParticipants.length;

    if (totalVotes === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Voting Results</h3>
                <p className="text-gray-500 text-sm">No votes to display.</p>
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Voting Results</h3>
            <div className="space-y-4">
                {results.map(item => (
                    <div key={item.vote}>
                        <div className="flex justify-between items-center mb-1 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold min-w-[2rem] text-center">
                                    {item.vote}
                                </span>
                            </div>
                            <span className="text-gray-500">{item.count} vote{item.count !== 1 ? 's' : ''} ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${item.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
