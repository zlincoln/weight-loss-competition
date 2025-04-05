import { getCurrentUser } from '../../../../lib/cloudflareAccess';
import { getUserWeightEntries, addWeightEntry } from '../../../../lib/db';

export const onRequestGet = async ({ request, params, env }) => {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is requesting their own data
    if (params.id !== currentUser.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query parameters
    const url = new URL(request.url);
    const competitionId = url.searchParams.get('competitionId');
    
    if (!competitionId) {
      return new Response(JSON.stringify({ error: 'Competition ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get weight entries for the user in the competition
    const weightEntries = await getUserWeightEntries(env.DB, currentUser.id, parseInt(competitionId));

    return new Response(JSON.stringify(weightEntries), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching weight entries:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost = async ({ request, env }) => {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const data = await request.json();
    const { userId, competitionId, weight, entryDate } = data;

    // Validate input
    if (!userId || !competitionId || !weight || !entryDate) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is submitting their own data
    if (userId !== currentUser.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add the weight entry
    const entry = await addWeightEntry(env.DB, userId, competitionId, weight, entryDate);

    return new Response(JSON.stringify(entry), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding weight entry:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};