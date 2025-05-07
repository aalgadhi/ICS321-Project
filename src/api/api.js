const API_BASE_URL = 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

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
export const addTournament = (tournamentData) => apiCall('/admin/tournaments', { method: 'POST', body: tournamentData });
export const deleteTournament = (trId) => apiCall(`/admin/tournaments/${trId}`, { method: 'DELETE' });
export const addTeamToTournament = (trId, teamData) => apiCall(`/admin/tournaments/${trId}/teams`, { method: 'POST', body: teamData });
export const setCaptain = (trId, teamId, playerId) => apiCall(`/admin/tournaments/${trId}/teams/${teamId}/captain/${playerId}`, { method: 'POST' });
export const approvePlayer = (trId, teamId, playerId) => apiCall(`/admin/tournaments/${trId}/teams/${teamId}/players/${playerId}`, { method: 'POST' });
export const getAllPlayers = () => apiCall('/admin/players');
export const getAllTeams = () => apiCall('/admin/teams');


export const getMatchResults = (trId) => apiCall(`/guest/tournaments/${trId}/matches`);
export const getHighestScorer = () => apiCall('/guest/players/highest-scorer');
export const getRedCardPlayers = () => apiCall('/guest/teams/red-cards');
export const getTeamMembers = (teamId, trId) => apiCall(`/guest/teams/${teamId}/${trId}/members`);