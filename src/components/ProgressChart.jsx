import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ProgressChart = ({ weightEntries, startDate, endDate }) => {
  // If no weight entries, show a message
  if (!weightEntries || weightEntries.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          No weight entries recorded yet. Start tracking your progress!
        </p>
      </div>
    );
  }
  
  // Sort entries by date
  const sortedEntries = [...weightEntries].sort(
    (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
  );
  
  // Calculate weight loss percentage for each entry
  const startingWeight = sortedEntries[0].weight;
  const entriesWithPercentage = sortedEntries.map(entry => ({
    ...entry,
    weightLost: startingWeight - entry.weight,
    percentageLost: ((startingWeight - entry.weight) / startingWeight) * 100
  }));
  
  // Prepare data for the weight chart
  const weightChartData = {
    labels: entriesWithPercentage.map(entry => new Date(entry.entry_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: entriesWithPercentage.map(entry => entry.weight),
        borderColor: 'rgb(59, 130, 246)', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Weight Loss (%)',
        data: entriesWithPercentage.map(entry => entry.percentageLost),
        borderColor: 'rgb(16, 185, 129)', // emerald
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Weight (lbs)'
        },
        beginAtZero: false,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Weight Loss (%)'
        },
        min: 0,
        max: Math.max(20, ...entriesWithPercentage.map(e => e.percentageLost)) + 5,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  
  return (
    <div>
      <Line data={weightChartData} options={chartOptions} />
      
      <div className="mt-4 text-sm text-gray-500 flex justify-between">
        <span>Competition Start: {new Date(startDate).toLocaleDateString()}</span>
        <span>Competition End: {new Date(endDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default ProgressChart;