const API_BASE_URL = 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
  // Include credentials for auth and admin endpoints
  const needsCredentials = endpoint.startsWith('/auth') || endpoint.startsWith('/admin');
  const fetchOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };
  if (needsCredentials) {
    fetchOptions.credentials = 'include';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null;
  }

  return response.json();
};

export const login = (username, password) => {
    return apiCall('/auth/login', {
        method: 'POST',
        body: { username, password },
    });
};

export const logout = () => {
     return apiCall('/auth/logout', {
        method: 'POST',
    });
};

export const getAuthStatus = () => {
     return apiCall('/auth/status');
};

// New signup API call
export const registerUser = (userData) => {
    return apiCall('/auth/signup', {
        method: 'POST',
        body: userData,
    });
};

export const getTournaments = () => apiCall('/guest/tournaments');
export const getAllTeams = () => apiCall('/guest/teams');
export const addTournament = (tournamentData) => apiCall('/admin/tournaments', { method: 'POST', body: tournamentData });
export const deleteTournament = (trId) => apiCall(`/admin/tournaments/${trId}`, { method: 'DELETE' });
export const addTeamToTournament = (trId, teamData) => apiCall(`/admin/tournaments/${trId}/teams`, { method: 'POST', body: teamData });
export const setCaptain = (trId, teamId, playerId) => apiCall(`/admin/tournaments/${trId}/teams/${teamId}/captain/${playerId}`, { method: 'POST' });
export const approvePlayer = (trId, teamId, playerId) => apiCall(`/admin/tournaments/${trId}/teams/${teamId}/players/${playerId}`, { method: 'POST' });
export const getAllPlayers = () => apiCall('/admin/players');
export const getAllTeamsAdmin = () => apiCall('/admin/teams');

export const getMatchResults = (trId) => apiCall(`/guest/tournaments/${trId}/matches`);
export const getHighestScorer = () => apiCall('/guest/players/highest-scorer');
export const getRedCardPlayers = () => apiCall('/guest/teams/red-cards');
export const getTeamMembers = (teamId, trId) => apiCall(`/guest/teams/${teamId}/${trId}/members`);
export const getUpcomingMatches = (trId) => apiCall(`/guest/tournaments/${trId}/next-matches`);

// Admin: Upcoming Matches
export const adminGetUpcomingMatches = (trId) => apiCall(`/admin/tournaments/${trId}/next-matches`);
export const adminAddUpcomingMatch = (trId, matchData) => apiCall(`/admin/tournaments/${trId}/next-matches`, { method: 'POST', body: matchData });
export const adminUpdateUpcomingMatch = (trId, matchNo, matchData) => apiCall(`/admin/tournaments/${trId}/next-matches/${matchNo}`, { method: 'PUT', body: matchData });
export const adminDeleteUpcomingMatch = (trId, matchNo) => apiCall(`/admin/tournaments/${trId}/next-matches/${matchNo}`, { method: 'DELETE' });
export const adminMoveUpcomingToPlayed = (trId, matchNo, playedData) => apiCall(`/admin/tournaments/${trId}/next-matches/${matchNo}/play`, { method: 'POST', body: playedData });
// Admin: Played Matches
export const adminGetPlayedMatches = (trId) => apiCall(`/admin/tournaments/${trId}/matches`);
export const adminAddPlayedMatch = (trId, matchData) => apiCall(`/admin/tournaments/${trId}/matches`, { method: 'POST', body: matchData });
export const adminUpdatePlayedMatch = (trId, matchNo, matchData) => apiCall(`/admin/tournaments/${trId}/matches/${matchNo}`, { method: 'PUT', body: matchData });
export const adminDeletePlayedMatch = (trId, matchNo) => apiCall(`/admin/tournaments/${trId}/matches/${matchNo}`, { method: 'DELETE' });

export const getAllVenues = () => apiCall('/guest/venues');