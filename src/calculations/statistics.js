/**
 * Returns statistic value by type from fixture statistics list.
 * @param {Array<{ type: string, value: string | number | null }>} statistics - Team statistics.
 * @param {string} type - Statistic type label from API.
 * @returns {number}
 */
function getStatisticValue(statistics, type) {
  const item = statistics.find((stat) => stat.type === type);

  if (!item || item.value === null || item.value === undefined) {
    return 0;
  }

  if (typeof item.value === "number") {
    return Number.isFinite(item.value) ? item.value : 0;
  }

  if (typeof item.value === "string") {
    const numeric = Number(item.value.replace("%", "").trim());
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return 0;
}

/**
 * Ensures a team record exists in the map.
 * @param {Map<number, { teamName: string, matchesPlayed: number, totalYellowCards: number, totalCorners: number }>} map
 * @param {number} teamId
 * @param {string} teamName
 * @returns {{ teamName: string, matchesPlayed: number, totalYellowCards: number, totalCorners: number }}
 */
function getOrCreateTeamStats(map, teamId, teamName) {
  if (!map.has(teamId)) {
    map.set(teamId, {
      teamName,
      matchesPlayed: 0,
      totalYellowCards: 0,
      totalCorners: 0,
    });
  }

  return map.get(teamId);
}

/**
 * Aggregates team statistics from fixture statistics endpoint payloads.
 * @param {Array<{ team: { id: number, name: string }, statistics: Array<{ type: string, value: string | number | null }> }>} fixtureStats
 * @param {Map<number, { teamName: string, matchesPlayed: number, totalYellowCards: number, totalCorners: number }>} statsMap
 * @returns {void}
 */
function consumeFixtureStatistics(fixtureStats, statsMap) {
  for (const teamStats of fixtureStats) {
    const teamId = teamStats?.team?.id;
    const teamName = teamStats?.team?.name;

    if (!teamId || !teamName) {
      continue;
    }

    const row = getOrCreateTeamStats(statsMap, teamId, teamName);
    const statistics = Array.isArray(teamStats.statistics) ? teamStats.statistics : [];
    const yellowCards = getStatisticValue(statistics, "Yellow Cards");
    const corners = getStatisticValue(statistics, "Corner Kicks");

    row.matchesPlayed += 1;
    row.totalYellowCards += yellowCards;
    row.totalCorners += corners;
  }
}

/**
 * Builds ranking list for average yellow cards.
 * @param {Map<number, { teamName: string, matchesPlayed: number, totalYellowCards: number, totalCorners: number }>} statsMap
 * @returns {Array<{ rank: number, team: string, matchesPlayed: number, totalYellowCards: number, averageYellowCards: number }>}
 */
function calculateAverageYellowCardsRanking(statsMap) {
  const rows = Array.from(statsMap.values())
    .filter((row) => row.matchesPlayed > 0)
    .map((row) => ({
      team: row.teamName,
      matchesPlayed: row.matchesPlayed,
      totalYellowCards: row.totalYellowCards,
      averageYellowCards: row.totalYellowCards / row.matchesPlayed,
    }))
    .sort((a, b) => b.averageYellowCards - a.averageYellowCards);

  return rows.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));
}

/**
 * Builds ranking list for total corners.
 * @param {Map<number, { teamName: string, matchesPlayed: number, totalYellowCards: number, totalCorners: number }>} statsMap
 * @returns {Array<{ rank: number, team: string, totalCorners: number }>}
 */
function calculateTotalCornersRanking(statsMap) {
  const rows = Array.from(statsMap.values())
    .map((row) => ({
      team: row.teamName,
      totalCorners: row.totalCorners,
    }))
    .sort((a, b) => b.totalCorners - a.totalCorners);

  return rows.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));
}

module.exports = {
  consumeFixtureStatistics,
  calculateAverageYellowCardsRanking,
  calculateTotalCornersRanking,
};
