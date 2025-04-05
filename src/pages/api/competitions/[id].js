import { getCurrentUser } from '../../../lib/cloudflareAccess';
import { 
  getCompetition, 
  getCompetitionParticipants, 
  getCompetitionRankings 
} from '../../../lib/db';

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

    const competitionId = parseInt(params.id);

    // Get competition details
    const competition = await getCompetition(env.DB, competitionId);
    if (!competition) {
      return new Response(JSON.stringify({ error: 'Competition not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get participants to check if the user is a participant
    const participants = await getCompetitionParticipants(env.DB, competitionId);
    const isParticipant = participants.some(p => p.user_id === currentUser.id);

    // If the user is not a participant, only return basic information
    if (!isParticipant) {
      return new Response(JSON.stringify({
        id: competition.id,
        name: competition.name,
        description: competition.description,
        start_date: competition.start_date,
        end_date: competition.end_date,
        is_participant: false,
        participant_count: participants.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get rankings
    const rankings = await getCompetitionRankings(env.DB, competitionId);

    // Find user's ranking
    const userRanking = rankings.find(r => r.user_id === currentUser.id);
    const userRank = rankings.findIndex(r => r.user_id === currentUser.id) + 1;

    // Return full competition details for participants
    return new Response(JSON.stringify({
      ...competition,
      is_participant: true,
      participant_count: participants.length,
      rankings: rankings.map(r => ({
        user_id: r.user_id,
        name: r.name,
        weight_lost: r.weight_lost,
        percentage_lost: r.percentage_lost,
        last_entry_date: r.last_entry_date
      })),
      user_ranking: {
        rank: userRank,
        weight_lost: userRanking ? userRanking.weight_lost : 0,
        percentage_lost: userRanking ? userRanking.percentage_lost : 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching competition details:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};