function calculateDurationSeconds(startedAt, endedAt) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  return Math.max(0, Math.floor((end - start) / 1000));
}

function formatSessionResponse(sessionRow) {
  return {
    id: sessionRow.id,
    users_id: sessionRow.users_id,
    games_id: sessionRow.games_id,
    started_at: sessionRow.started_at,
    ended_at: sessionRow.ended_at,
    duration_seconds: sessionRow.duration_seconds,
    created_at: sessionRow.created_at,
  };
}

module.exports = {
  calculateDurationSeconds,
  formatSessionResponse,
};