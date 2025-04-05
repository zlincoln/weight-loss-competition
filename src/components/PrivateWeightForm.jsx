import React, { useState } from 'react';

const PrivateWeightForm = ({ userId, competitionId, onWeightSubmitted }) => {
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
      setError('Please enter a valid weight');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      
      // Format today's date as YYYY-MM-DD
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      // Submit the weight entry
      const response = await fetch('/api/users/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          competitionId,
          weight: parseFloat(weight),
          entryDate: formattedDate
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit weight');
      }
      
      // Success!
      setSuccess(true);
      setWeight('');
      
      // Call the callback function if provided
      if (onWeightSubmitted) {
        onWeightSubmitted();
      }
    } catch (err) {
      console.error('Error submitting weight:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Record Today's Weight</h3>
      <p className="text-gray-600 mb-4">
        Your weight is kept private and only your progress percentage will be visible to other participants.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <p>Weight recorded successfully!</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="weight" className="block text-gray-700 text-sm font-medium mb-2">
            Your Current Weight (lbs)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            step="0.1"
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter your weight in pounds"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-emerald-300"
        >
          {isSubmitting ? 'Submitting...' : 'Record Weight'}
        </button>
      </form>
      
      <p className="mt-4 text-sm text-gray-500">
        Please record your weight at the same time each day, preferably in the morning after waking up, for the most accurate results.
      </p>
    </div>
  );
};

export default PrivateWeightForm;