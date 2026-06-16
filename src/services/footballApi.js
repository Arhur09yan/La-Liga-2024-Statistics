const axios = require("axios");
const { delay } = require("../utils/delay");

const API_BASE_URL =
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY;
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS || 350);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "x-apisports-key": API_KEY,
  },
});

/**
 * Normalizes API request errors into readable messages.
 * @param {unknown} error - Axios error object.
 * @param {string} context - Operation context.
 * @returns {Error}
 */
function createApiError(error, context) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage =
      error.response?.data?.errors || error.response?.data?.message;
    const details = apiMessage
      ? JSON.stringify(apiMessage)
      : error.message || "Unknown error";
    return new Error(`${context} failed${status ? ` (${status})` : ""}: ${details}`);
  }

  return new Error(`${context} failed: ${String(error)}`);
}

/**
 * Performs a GET request and applies delay for rate limiting.
 * @param {string} endpoint - API endpoint.
 * @param {Record<string, string | number>} params - Query params.
 * @returns {Promise<any[]>}
 */
async function getWithRateLimit(endpoint, params) {
  try {
    const response = await client.get(endpoint, { params });
    await delay(REQUEST_DELAY_MS);

    const errors = response.data?.errors;
    if (errors && Object.keys(errors).length > 0) {
      throw new Error(`API error: ${JSON.stringify(errors)}`);
    }

    return response.data?.response || [];
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("API error:")) {
      throw error;
    }
    throw createApiError(error, `Request to ${endpoint}`);
  }
}

/**
 * Fetches all fixtures for a league and season.
 * @param {number} leagueId - League ID.
 * @param {number} season - Season year.
 * @returns {Promise<any[]>}
 */
async function getLeagueFixtures(leagueId, season) {
  return getWithRateLimit("/fixtures", { league: leagueId, season });
}

/**
 * Fetches fixture statistics for both teams in one fixture.
 * @param {number} fixtureId - Fixture ID.
 * @returns {Promise<any[]>}
 */
async function getFixtureStatistics(fixtureId) {
  return getWithRateLimit("/fixtures/statistics", { fixture: fixtureId });
}

module.exports = {
  getLeagueFixtures,
  getFixtureStatistics,
};
