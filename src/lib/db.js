/**
 * Database operations using Cloudflare D1
 */

/**
 * Initialize the database schema
 * @param {D1Database} db - The D1 database instance
 */
export async function initializeDatabase(db) {
    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        is_admin BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  
    // Create competitions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS competitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
  
    // Create competition_participants table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS competition_participants (
        competition_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TEXT DEFAULT (datetime('now')),
        starting_weight REAL NOT NULL,
        PRIMARY KEY (competition_id, user_id),
        FOREIGN KEY (competition_id) REFERENCES competitions(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  
    // Create weight_entries table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS weight_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        competition_id INTEGER NOT NULL,
        weight REAL NOT NULL,
        entry_date TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (competition_id) REFERENCES competitions(id)
      )
    `);
  }
  
  /**
   * Get or create a user in the database
   * @param {D1Database} db - The D1 database instance
   * @param {Object} userData - User data from Cloudflare Access
   * @returns {Object} - The user object
   */
  export async function getOrCreateUser(db, userData) {
    const { id, email, name } = userData;
    
    // Try to find the user
    const existingUser = await db.prepare(
      `SELECT * FROM users WHERE id = ?`
    ).bind(id).first();
    
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    await db.prepare(
      `INSERT INTO users (id, email, name) VALUES (?, ?, ?)`
    ).bind(id, email, name).run();
    
    return {
      id,
      email,
      name,
      is_admin: 0,
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Create a new competition
   * @param {D1Database} db - The D1 database instance
   * @param {Object} competitionData - Competition data
   * @returns {Object} - The created competition
   */
  export async function createCompetition(db, competitionData) {
    const { name, description, start_date, end_date, created_by } = competitionData;
    
    const result = await db.prepare(
      `INSERT INTO competitions (name, description, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(name, description, start_date, end_date, created_by).run();
    
    const competitionId = result.meta?.last_row_id;
    
    return {
      id: competitionId,
      name,
      description,
      start_date,
      end_date,
      created_by,
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Add a user to a competition
   * @param {D1Database} db - The D1 database instance
   * @param {number} competitionId - The competition ID
   * @param {string} userId - The user ID
   * @param {number} startingWeight - The user's starting weight
   * @returns {Object} - The result
   */
  export async function addUserToCompetition(db, competitionId, userId, startingWeight) {
    return await db.prepare(
      `INSERT INTO competition_participants (competition_id, user_id, starting_weight)
       VALUES (?, ?, ?)`
    ).bind(competitionId, userId, startingWeight).run();
  }
  
  /**
   * Add a weight entry for a user
   * @param {D1Database} db - The D1 database instance
   * @param {string} userId - The user ID
   * @param {number} competitionId - The competition ID
   * @param {number} weight - The weight value
   * @param {string} entryDate - The entry date (YYYY-MM-DD)
   * @returns {Object} - The created weight entry
   */
  export async function addWeightEntry(db, userId, competitionId, weight, entryDate) {
    const result = await db.prepare(
      `INSERT INTO weight_entries (user_id, competition_id, weight, entry_date)
       VALUES (?, ?, ?, ?)`
    ).bind(userId, competitionId, weight, entryDate).run();
    
    const entryId = result.meta?.last_row_id;
    
    return {
      id: entryId,
      user_id: userId,
      competition_id: competitionId,
      weight,
      entry_date: entryDate,
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Get competition details
   * @param {D1Database} db - The D1 database instance
   * @param {number} competitionId - The competition ID
   * @returns {Object} - The competition details
   */
  export async function getCompetition(db, competitionId) {
    return await db.prepare(
      `SELECT * FROM competitions WHERE id = ?`
    ).bind(competitionId).first();
  }
  
  /**
   * Get all competitions
   * @param {D1Database} db - The D1 database instance
   * @returns {Array} - The list of competitions
   */
  export async function getAllCompetitions(db) {
    return await db.prepare(
      `SELECT * FROM competitions ORDER BY start_date DESC`
    ).all();
  }
  
  /**
   * Get competition participants
   * @param {D1Database} db - The D1 database instance
   * @param {number} competitionId - The competition ID
   * @returns {Array} - The list of participants
   */
  export async function getCompetitionParticipants(db, competitionId) {
    const participants = await db.prepare(
      `SELECT cp.*, u.name, u.email
       FROM competition_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.competition_id = ?`
    ).bind(competitionId).all();
    
    return participants.results;
  }
  
  /**
   * Get a user's weight entries for a competition
   * @param {D1Database} db - The D1 database instance
   * @param {string} userId - The user ID
   * @param {number} competitionId - The competition ID
   * @returns {Array} - The list of weight entries
   */
  export async function getUserWeightEntries(db, userId, competitionId) {
    const entries = await db.prepare(
      `SELECT * FROM weight_entries
       WHERE user_id = ? AND competition_id = ?
       ORDER BY entry_date ASC`
    ).bind(userId, competitionId).all();
    
    return entries.results;
  }
  
  /**
   * Get competition rankings
   * @param {D1Database} db - The D1 database instance
   * @param {number} competitionId - The competition ID
   * @returns {Array} - The rankings
   */
  export async function getCompetitionRankings(db, competitionId) {
    // Get all participants with their starting weights
    const participants = await getCompetitionParticipants(db, competitionId);
    
    // For each participant, get their latest weight entry
    const rankings = [];
    
    for (const participant of participants) {
      const latestEntry = await db.prepare(
        `SELECT * FROM weight_entries
         WHERE user_id = ? AND competition_id = ?
         ORDER BY entry_date DESC
         LIMIT 1`
      ).bind(participant.user_id, competitionId).first();
      
      if (latestEntry) {
        const startingWeight = participant.starting_weight;
        const currentWeight = latestEntry.weight;
        const weightLost = startingWeight - currentWeight;
        const percentageLost = (weightLost / startingWeight) * 100;
        
        rankings.push({
          user_id: participant.user_id,
          name: participant.name,
          weight_lost: weightLost,
          percentage_lost: percentageLost,
          last_entry_date: latestEntry.entry_date
        });
      } else {
        // No entries yet, 0% loss
        rankings.push({
          user_id: participant.user_id,
          name: participant.name,
          weight_lost: 0,
          percentage_lost: 0,
          last_entry_date: null
        });
      }
    }
    
    // Sort by percentage lost (highest first)
    return rankings.sort((a, b) => b.percentage_lost - a.percentage_lost);
  }
  
  /**
   * Get collective statistics for a competition
   * @param {D1Database} db - The D1 database instance
   * @param {number} competitionId - The competition ID
   * @returns {Object} - The collective statistics
   */
  export async function getCollectiveStatistics(db, competitionId) {
    const participants = await getCompetitionParticipants(db, competitionId);
    
    let totalStartingWeight = 0;
    let totalCurrentWeight = 0;
    let participantsWithEntries = 0;
    
    for (const participant of participants) {
      totalStartingWeight += participant.starting_weight;
      
      const latestEntry = await db.prepare(
        `SELECT * FROM weight_entries
         WHERE user_id = ? AND competition_id = ?
         ORDER BY entry_date DESC
         LIMIT 1`
      ).bind(participant.user_id, competitionId).first();
      
      if (latestEntry) {
        totalCurrentWeight += latestEntry.weight;
        participantsWithEntries++;
      } else {
        totalCurrentWeight += participant.starting_weight;
      }
    }
    
    const totalWeightLost = totalStartingWeight - totalCurrentWeight;
    const percentageLost = totalStartingWeight > 0 ? (totalWeightLost / totalStartingWeight) * 100 : 0;
    
    return {
      total_participants: participants.length,
      active_participants: participantsWithEntries,
      total_starting_weight: totalStartingWeight,
      total_current_weight: totalCurrentWeight,
      total_weight_lost: totalWeightLost,
      percentage_lost: percentageLost
    };
  }