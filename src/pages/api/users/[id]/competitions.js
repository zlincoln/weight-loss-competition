import { getCurrentUser } from '../../../../lib/cloudflareAccess';
import { 
  getAllCompetitions, 
  getCompetitionParticipants,
  getCompetitionRankings 
} from '../../../../lib/db';

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
    const activeOnly = url.searchParams.get('active') === 'true';

    // Get all competitions
    const { results: allCompetitions } = await getAllCompetitions(env.DB);

    // Filter competitions where the user is a participant
    const userCompetitions = [];
    for (const competition of allCompetitions) {
      const participants = await getCompetitionParticipants(env.DB, competition.id);
      const isParticipant = participants.some(p => p.user_id === currentUser.id);
      
      if (isParticipant) {
        const isActive = new Date(competition.end_date) >= new Date();
        
        // Skip inactive competitions if activeOnly is true
        if (activeOnly && !isActive) {
          continue;
        }
        
        // Get rankings for this competition
        const rankings = await getCompetitionRankings(env.DB, competition.id);
        
        // Find user's rank
        const userRank = rankings.findIndex(r => r.user_id === currentUser.id) + 1;
        const userStats = rankings.find(r => r.user_id === currentUser.id);
        
        userCompetitions.push({
          id: competition.id,
          name: competition.name,
          description: competition.description,
          start_date: competition.start_date,
          end_date: competition.end_date,
          rank: userRank,
          total_participants: participants.length,
          weight_lost: userStats ? userStats.weight_lost : 0,
          percentage_lost: userStats ? userStats.percentage_lost : 0,
          is_active: isActive
        });
      }
    }

    // Sort competitions: active first, then by end date (most recent first)
    userCompetitions.sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return new Date(b.end_date) - new Date(a.end_date);
    });

    return new Response(JSON.stringify(userCompetitions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user competitions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};