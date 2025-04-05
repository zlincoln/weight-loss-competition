/**
 * Cloudflare Access integration for authentication
 * This module handles JWT validation and user authentication
 */

// Constants for Cloudflare Access configuration
const CLOUDFLARE_TEAM_DOMAIN = import.meta.env.CLOUDFLARE_TEAM_DOMAIN || '';
const CLOUDFLARE_AUD = import.meta.env.CLOUDFLARE_AUD || '';

/**
 * Validates the Cloudflare Access JWT token from request headers
 * @param {Request} request - The incoming request
 * @returns {Object|null} - The decoded JWT payload or null if invalid
 */
export async function validateAccessToken(request) {
  try {
    // Get the CF_Authorization cookie or Authorization header
    const cfAccessToken = getCFAccessToken(request);
    if (!cfAccessToken) {
      return null;
    }

    // Fetch JWKS from Cloudflare Access
    const jwks = await fetchJWKS();
    if (!jwks) {
      console.error('Failed to fetch JWKS');
      return null;
    }

    // Validate and decode the token
    const decoded = await verifyJWT(cfAccessToken, jwks);
    
    // Verify the audience claim
    if (decoded.aud !== CLOUDFLARE_AUD) {
      console.error('Invalid audience in JWT token');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error validating Access token:', error);
    return null;
  }
}

/**
 * Extract Cloudflare Access token from request
 * @param {Request} request - The incoming request
 * @returns {string|null} - The access token or null
 */
function getCFAccessToken(request) {
  // Check for the CF_Authorization cookie
  const cookies = request.headers.get('Cookie') || '';
  const cookieMatch = cookies.match(/CF_Authorization=([^;]+)/);
  if (cookieMatch) {
    return cookieMatch[1];
  }

  // Check for Authorization header
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Fetch JSON Web Key Set from Cloudflare Access
 * @returns {Object} - The JWKS response
 */
async function fetchJWKS() {
  try {
    const response = await fetch(`https://${CLOUDFLARE_TEAM_DOMAIN}/cdn-cgi/access/certs`);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching JWKS:', error);
    return null;
  }
}

/**
 * Verify and decode JWT token
 * @param {string} token - The JWT token
 * @param {Object} jwks - The JSON Web Key Set
 * @returns {Object} - The decoded JWT payload
 */
async function verifyJWT(token, jwks) {
  // In a production app, you'd use a proper JWT library
  // This is a simplified implementation
  
  // Split the token into header, payload, and signature
  const [headerB64, payloadB64] = token.split('.');
  
  // Decode the payload
  const payload = JSON.parse(atob(payloadB64));
  
  // In a real implementation, you'd:
  // 1. Find the right key from JWKS using the kid in the header
  // 2. Verify the signature using the public key
  // 3. Check exp, nbf, and other claims
  
  return payload;
}

/**
 * Middleware to protect routes with Cloudflare Access
 * @param {Request} request - The incoming request
 * @returns {Response|null} - Redirect response if unauthorized, null if authorized
 */
export async function protectRoute(request) {
  const user = await validateAccessToken(request);
  
  if (!user) {
    // Redirect to the login page or Cloudflare Access login
    return new Response('Unauthorized: You must be logged in to access this page', {
      status: 401,
      headers: {
        'Location': '/.cloudflare/access/login'
      }
    });
  }
  
  return null;
}

/**
 * Get the current user from the request
 * @param {Request} request - The incoming request
 * @returns {Object|null} - The user object or null
 */
export async function getCurrentUser(request) {
  const accessPayload = await validateAccessToken(request);
  
  if (!accessPayload) {
    return null;
  }
  
  // Extract user information from the Access token
  return {
    id: accessPayload.sub,
    email: accessPayload.email,
    name: accessPayload.name || accessPayload.email.split('@')[0],
    // Add any other user properties you need
  };
}

/**
 * Check if the current user is an admin
 * @param {Request} request - The incoming request
 * @returns {boolean} - Whether the user is an admin
 */
export async function isAdmin(request) {
  const user = await getCurrentUser(request);
  if (!user) return false;
  
  // Check if the user is in the admin group
  // This would depend on your Cloudflare Access setup
  // For MVP, we'll hardcode a list of admin emails
  const adminEmails = ['admin@example.com'];
  return adminEmails.includes(user.email);
}