import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CompetitionDashboard = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weightEntries, setWeightEntries] = useState([]);
  const [activeCompetition, setActiveCompetition] = useState(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user's active competitions
        const competitionsResponse = await fetch(`/api/users/${userId}/competitions?active=true`);
        if (!competitionsResponse.ok) {
          throw new Error('Failed to fetch competitions');
        }
        
        const competitionsData = await competitionsResponse.json();
        
        // Get the most recent active competition
        if (competitionsData.length > 0) {
          const competition = competitionsData[0];
          setActiveCompetition(competition);
          
          // Fetch weight entries for this competition
          const entriesResponse = await fetch(`/api/users/${userId}/weights?competitionId=${competition.id}`);
          if (!entriesResponse.ok) {
            throw new Error('Failed to fetch weight entries');
          }
          
          const entriesData = await entriesResponse.json();
          setWeightEntries(entriesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // If there's no active competition, show a message
  if (!isLoading && !activeCompetition) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          You don't have any active competitions at the moment.
        </p>
        <a 
          href="/competition" 
          className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Browse Competitions
        </a>
      </div>
    );
  }
  
  // If loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  // If there's an error, show an error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  // Prepare data for the chart
  const chartData = {
    labels: weightEntries.map(entry => new Date(entry.entry_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: weightEntries.map(entry => entry.weight),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
      }
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Your Weight Progress',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };
  
  // Calculate stats
  const startingWeight = weightEntries.length > 0 ? weightEntries[0].weight : 0;
  const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : 0;
  const weightLost = startingWeight - currentWeight;
  const percentageLost = (weightLost / startingWeight) * 100;
  
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{activeCompetition.name} Progress</h3>
      
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <p className="text-sm text-emerald-600 font-medium">Starting Weight</p>
          <p className="text-2xl font-bold">{startingWeight.toFixed(1)} lbs</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Current Weight</p>
          <p className="text-2xl font-bold">{currentWeight.toFixed(1)} lbs</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-600 font-medium">Weight Lost</p>
          <p className="text-2xl font-bold">{weightLost.toFixed(1)} lbs</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Percentage Lost</p>
          <p className="text-2xl font-bold">{percentageLost.toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-6 flex justify-end">
        <a 
          href={`/competition/${activeCompetition.id}`} 
          className="text-emerald-600 hover:text-emerald-800 font-medium"
        >
          View Full Competition Details →
        </a>
      </div>
    </div>
  );
};

export default CompetitionDashboard;