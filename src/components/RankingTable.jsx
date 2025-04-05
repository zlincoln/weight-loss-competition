import React from 'react';

const RankingsTable = ({ rankings, currentUserId }) => {
  // If no rankings, show a message
  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">
          No participants have recorded their weight yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Participant
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Weight Lost
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rankings.map((ranking, index) => (
            <tr 
              key={ranking.user_id}
              className={currentUserId === ranking.user_id ? 'bg-emerald-50' : ''}
            >
              <td className="py-2 px-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {index + 1}
                {index === 0 && <span className="ml-1 text-yellow-500">🏆</span>}
              </td>
              <td className="py-2 px-3 whitespace-nowrap text-sm text-gray-900">
                {ranking.name}
                {currentUserId === ranking.user_id && <span className="ml-2 text-xs text-emerald-600">(You)</span>}
              </td>
              <td className="py-2 px-3 whitespace-nowrap text-sm text-right text-gray-900">
                {ranking.weight_lost.toFixed(1)} lbs
              </td>
              <td className="py-2 px-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                {ranking.percentage_lost.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingsTable;