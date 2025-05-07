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
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'guest') {
    return null;
  }

  return (
    <div>
      <h1>Guest Dashboard</h1>
      <h3 className="mt-4">Features:</h3>
      <ul className="list-group">
        <li className="list-group-item"><Link to="/guest/match-results">Browse Match Results by Tournament</Link></li>
        <li className="list-group-item"><Link to="/guest/highest-scorer">Browse Highest Goal Scorer</Link></li>
        <li className="list-group-item"><Link to="/guest/red-cards">Browse Players with Red Cards</Link></li>
        <li className="list-group-item d-flex align-items-center">
            <span>Browse Team Members:</span>
             <select className="form-select form-select-sm ms-2 me-2 w-auto" value={selectedTeamMembersTourn} onChange={e => setSelectedTeamMembersTourn(e.target.value)}>
                 <option value="">Select Tournament</option>
                 {tournaments.map(t => <option key={t.tr_id} value={t.tr_id}>{t.tr_name}</option>)}
             </select>
             <select className="form-select form-select-sm me-2 w-auto" value={selectedTeamMembersTeam} onChange={e => setSelectedTeamMembersTeam(e.target.value)}>
                 <option value="">Select Team</option>
                 {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
             </select>
             {selectedTeamMembersTeam && selectedTeamMembersTourn && (
                <Link className="btn btn-secondary btn-sm" to={`/guest/team-members/${selectedTeamMembersTeam}/${selectedTeamMembersTourn}`}>View Members</Link>
             )}
        </li>
      </ul>
    </div>
  );
};

export default GuestDashboard;