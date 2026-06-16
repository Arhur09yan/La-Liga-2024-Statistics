require("dotenv").config();
const ExcelJS = require("exceljs");
const { getLeagueFixtures, getFixtureStatistics } = require("./services/footballApi");
const {
  consumeFixtureStatistics,
  calculateAverageYellowCardsRanking,
  calculateTotalCornersRanking,
} = require("./calculations/statistics");

const LEAGUE_ID = 140;
const SEASON = 2024;
const OUTPUT_FILE = "la-liga-2024-statistics.xlsx";

/**
 * Checks required environment variables.
 */
function validateEnvironment() {
  if (!process.env.API_FOOTBALL_KEY) {
    throw new Error("Missing API_FOOTBALL_KEY in .env file.");
  }
}

/**
 * Returns true if fixture is finished.
 * @param {{ fixture?: { status?: { short?: string } } }} fixture
 * @returns {boolean}
 */
function isFinishedFixture(fixture) {
  const status = fixture?.fixture?.status?.short;
  const finishedStatuses = new Set(["FT", "AET", "PEN"]);
  return finishedStatuses.has(status);
}

/**
 * Creates worksheet with common column styling.
 * @param {ExcelJS.Workbook} workbook
 * @param {string} name
 * @param {Array<{ header: string, key: string, width: number, style?: object }>} columns
 * @returns {ExcelJS.Worksheet}
 */
function addStyledSheet(workbook, name, columns) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return sheet;
}

/**
 * Exports rankings to Excel file.
 * @param {Array<{ rank: number, team: string, matchesPlayed: number, totalYellowCards: number, averageYellowCards: number }>} yellowRanking
 * @param {Array<{ rank: number, team: string, totalCorners: number }>} cornersRanking
 * @returns {Promise<void>}
 */
async function exportToExcel(yellowRanking, cornersRanking) {
  const workbook = new ExcelJS.Workbook();

  const yellowSheet = addStyledSheet(workbook, "Average Yellow Cards", [
    { header: "Rank", key: "rank", width: 10 },
    { header: "Team", key: "team", width: 28 },
    { header: "Matches Played", key: "matchesPlayed", width: 18 },
    { header: "Total Yellow Cards", key: "totalYellowCards", width: 20 },
    {
      header: "Average Yellow Cards",
      key: "averageYellowCards",
      width: 22,
      style: { numFmt: "0.00" },
    },
  ]);
  yellowSheet.addRows(yellowRanking);

  const cornersSheet = addStyledSheet(workbook, "Total Corners", [
    { header: "Rank", key: "rank", width: 10 },
    { header: "Team", key: "team", width: 28 },
    { header: "Total Corners", key: "totalCorners", width: 16 },
  ]);
  cornersSheet.addRows(cornersRanking);

  await workbook.xlsx.writeFile(OUTPUT_FILE);
}

/**
 * Prints final tables to console.
 * @param {Array<{ rank: number, team: string, matchesPlayed: number, totalYellowCards: number, averageYellowCards: number }>} yellowRanking
 * @param {Array<{ rank: number, team: string, totalCorners: number }>} cornersRanking
 */
function printTables(yellowRanking, cornersRanking) {
  console.log("\n=== Average Yellow Cards by Team ===");
  console.table(
    yellowRanking.map((row) => ({
      Rank: row.rank,
      Team: row.team,
      "Matches Played": row.matchesPlayed,
      "Total Yellow Cards": row.totalYellowCards,
      "Average Yellow Cards": Number(row.averageYellowCards.toFixed(2)),
    }))
  );

  console.log("\n=== Total Corners by Team ===");
  console.table(
    cornersRanking.map((row) => ({
      Rank: row.rank,
      Team: row.team,
      "Total Corners": row.totalCorners,
    }))
  );
}

/**
 * Main application flow.
 * @returns {Promise<void>}
 */
async function main() {
  validateEnvironment();
  console.log(`Fetching La Liga fixtures for season ${SEASON}...`);

  const fixtures = await getLeagueFixtures(LEAGUE_ID, SEASON);
  const finishedFixtures = fixtures.filter(isFinishedFixture);
  console.log(
    `Found ${fixtures.length} fixtures, ${finishedFixtures.length} finished. Processing statistics...`
  );

  const teamStatsMap = new Map();
  let processed = 0;

  for (const fixture of finishedFixtures) {
    const fixtureId = fixture?.fixture?.id;
    if (!fixtureId) {
      continue;
    }

    processed += 1;
    console.log(`[${processed}/${finishedFixtures.length}] Fixture ${fixtureId}`);
    const fixtureStatistics = await getFixtureStatistics(fixtureId);
    consumeFixtureStatistics(fixtureStatistics, teamStatsMap);
  }

  const yellowRanking = calculateAverageYellowCardsRanking(teamStatsMap);
  const cornersRanking = calculateTotalCornersRanking(teamStatsMap);

  printTables(yellowRanking, cornersRanking);
  await exportToExcel(yellowRanking, cornersRanking);
  console.log(`\nExcel report generated: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Application error:", error.message);
  process.exitCode = 1;
});
