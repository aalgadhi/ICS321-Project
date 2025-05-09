import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getTournaments, getAllTeams } from '../api/api';

const GuestDashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamMembersTeam, setSelectedTeamMembersTeam] = useState('');
  const [selectedTeamMembersTourn, setSelectedTeamMembersTourn] = useState('');
  const [selectedUpcomingTourn, setSelectedUpcomingTourn] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'guest')) {
      navigate('/');
    }
    if (user && user.role === 'guest') {
      fetchData();
    }
  }, [user, isLoading, navigate]);

  const fetchData = async () => {
    try {
      const [tournamentsData, teamsData] = await Promise.all([
        getTournaments(),
        getAllTeams()
      ]);
      setTournaments(tournamentsData);
      setTeams(teamsData);
    } catch (error) {
      console.error("Failed to fetch data for guest:", error);
    }
  };

  if (isLoading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!user || user.role !== 'guest') {
    return null;
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Guest Dashboard</h1>
      
      <div className="row">
        {/* Match Information Section */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Match Information</h3>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/guest/match-results" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <span>Match Results</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <div className="list-group-item">
                  <div className="d-flex align-items-center mb-2">
                    <span className="me-2">Upcoming Matches:</span>
                    <select 
                      className="form-select form-select-sm" 
                      value={selectedUpcomingTourn} 
                      onChange={e => setSelectedUpcomingTourn(e.target.value)}
                    >
                      <option value="">Select Tournament</option>
                      {tournaments.map(t => (
                        <option key={t.tr_id} value={t.tr_id}>{t.tr_name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedUpcomingTourn && (
                    <Link 
                      className="btn btn-primary btn-sm" 
                      to={`/guest/upcoming-matches/${selectedUpcomingTourn}`}
                    >
                      View Upcoming Matches
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Statistics Section */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h3 className="h5 mb-0">Player Statistics</h3>
            </div>
            <div className="card-body">
              <div className="list-group">
                <Link to="/guest/highest-scorer" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <span>Highest Goal Scorers</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <Link to="/guest/red-cards" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                  <span>Players with Red Cards</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Team Information Section */}
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h3 className="h5 mb-0">Team Information</h3>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <label className="form-label">Select Tournament:</label>
                  <select 
                    className="form-select" 
                    value={selectedTeamMembersTourn} 
                    onChange={e => setSelectedTeamMembersTourn(e.target.value)}
                  >
                    <option value="">Choose Tournament</option>
                    {tournaments.map(t => (
                      <option key={t.tr_id} value={t.tr_id}>{t.tr_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Select Team:</label>
                  <select 
                    className="form-select" 
                    value={selectedTeamMembersTeam} 
                    onChange={e => setSelectedTeamMembersTeam(e.target.value)}
                  >
                    <option value="">Choose Team</option>
                    {teams.map(t => (
                      <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  {selectedTeamMembersTeam && selectedTeamMembersTourn && (
                    <Link 
                      className="btn btn-primary w-100" 
                      to={`/guest/team-members/${selectedTeamMembersTeam}/${selectedTeamMembersTourn}`}
                    >
                      View Team Members
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;