import { getCurrentUser, isAdmin } from '../../../lib/cloudflareAccess';
import { getAllCompetitions, createCompetition } from '../../../lib/db';

export const onRequestGet = async ({ request, env }) => {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query parameters
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    
    // Get all competitions
    const { results: allCompetitions } = await getAllCompetitions(env.DB);
    
    // Filter active competitions if needed
    let competitions = allCompetitions;
    if (activeOnly) {
      competitions = allCompetitions.filter(comp => new Date(comp.end_date) >= new Date());
    }

    return new Response(JSON.stringify(competitions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
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

    // Check if user is an admin
    const userIsAdmin = await isAdmin(request);
    if (!userIsAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const data = await request.json();
    const { name, description, start_date, end_date } = data;

    // Validate input
    if (!name || !start_date || !end_date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create the competition
    const competition = await createCompetition(env.DB, {
      name,
      description,
      start_date,
      end_date,
      created_by: currentUser.id
    });

    return new Response(JSON.stringify(competition), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};