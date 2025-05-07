import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRedCardPlayers } from '../api/api';

const RedCardPage = () => {
     const { user, isLoading } = useAuth();
     const navigate = useNavigate();
     const [redCardTeams, setRedCardTeams] = useState([]);
     const [error, setError] = useState('');
     const [loadingCards, setLoadingCards] = useState(true);

     useEffect(() => {
        if (!isLoading && (!user || user.role !== 'guest')) {
            navigate('/');
        }
         if (user) {
             fetchRedCardPlayers();
         }
    }, [user, isLoading, navigate]);


     const fetchRedCardPlayers = async () => {
         setLoadingCards(true);
         setError('');
         try {
             const data = await getRedCardPlayers();
             setRedCardTeams(data);
         } catch (err) {
              setError(`Failed to load red card players: ${err.message}`);
              setRedCardTeams([]);
         } finally {
            setLoadingCards(false);
         }
     };


    if (isLoading || loadingCards) {
        return <div>Loading...</div>;
   }

   if (!user) {
       return null;
   }

    return (
        <div>
            <h1>Players with Red Cards (by Team)</h1>
             {error && <div className="alert alert-danger mt-3">{error}</div>}

             {redCardTeams.length > 0 ? (
                 redCardTeams.map(team => (
                     <div key={team.team_id} className="card mt-3">
                         <div className="card-header">
                             <h3>{team.team_name}</h3>
                         </div>
                         <ul className="list-group list-group-flush">
                             {team.players.map(player => (
                                 <li key={`${player.player_id}-${player.match_no}`} className="list-group-item">
                                     {player.player_name} ({player.player_id}) - Match {player.match_no} ({new Date(player.match_date).toLocaleDateString()})
                                 </li>
                             ))}
                         </ul>
                     </div>
                 ))
             ) : (
                 !error && <p>No red cards recorded yet.</p>
             )}
        </div>
    );
};

export default RedCardPage;