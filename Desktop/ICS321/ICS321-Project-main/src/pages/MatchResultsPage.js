import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTournaments, getMatchResults } from '../api/api';

const MatchResultsPage = () => {
   const { user, isLoading } = useAuth();
   const navigate = useNavigate();
   const [tournaments, setTournaments] = useState([]);
   const [selectedTournamentId, setSelectedTournamentId] = useState('');
   const [matchResults, setMatchResults] = useState([]);
   const [error, setError] = useState('');


   useEffect(() => {
        if (!isLoading && (!user || user.role !== 'guest')) {
            navigate('/');
        }
        if (user) {
            fetchTournaments();
        }
   }, [user, isLoading, navigate]);

   const fetchTournaments = async () => {
       try {
           const data = await getTournaments();
           setTournaments(data);
       } catch (err) {
           setError("Failed to load tournaments.");
           console.error("Error fetching tournaments:", err);
       }
   };

   const handleTournamentChange = async (trId) => {
       setSelectedTournamentId(trId);
       setMatchResults([]);
       setError('');
       if (trId) {
           try {
               const data = await getMatchResults(trId);
               setMatchResults(data);
           } catch (err) {
               setError(`Failed to load match results: ${err.message}`);
               console.error("Error fetching match results:", err);
           }
       }
   };


   if (isLoading) {
        return <div>Loading...</div>;
   }

   if (!user) {
       return null;
   }


  return (
     <div>
        <h1>Match Results by Tournament</h1>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
         <div className="mb-3">
            <label htmlFor="tournamentSelect" className="form-label">Select Tournament:</label>
            <select className="form-select" id="tournamentSelect" value={selectedTournamentId} onChange={e => handleTournamentChange(e.target.value)}>
                <option value="">-- Select --</option>
                {tournaments.map(tourn => (
                    <option key={tourn.tr_id} value={tourn.tr_id}>{tourn.tr_name}</option>
                ))}
            </select>
         </div>

         {selectedTournamentId && (
             matchResults.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-striped table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>Match No</th>
                                <th>Stage</th>
                                <th>Date</th>
                                <th>Team 1</th>
                                <th>Team 2</th>
                                <th>Result</th>
                                <th>Score</th>
                                <th>Venue</th>
                                <th>Audience</th>
                                <th>Player of Match</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matchResults.map(match => (
                                <tr key={match.match_no}>
                                    <td>{match.match_no}</td>
                                    <td>{match.play_stage}</td>
                                    <td>{new Date(match.play_date).toLocaleDateString()}</td>
                                    <td>{match.team1_name}</td>
                                    <td>{match.team2_name}</td>
                                    <td>{match.results || 'N/A'}</td>
                                    <td>{match.goal_score || 'N/A'}</td>
                                    <td>{match.venue_name}</td>
                                    <td>{match.audience || 'N/A'}</td>
                                    <td>{match.player_of_match_name || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             ) : (
                 <p>No match results found for this tournament yet.</p>
             )
         )}
     </div>
  );
};

export default MatchResultsPage;