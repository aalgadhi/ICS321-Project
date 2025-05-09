import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addTournament, getTournaments, deleteTournament, getAllTeams, getAllPlayers, addTeamToTournament, setCaptain, approvePlayer, adminGetUpcomingMatches, adminAddUpcomingMatch, adminUpdateUpcomingMatch, adminDeleteUpcomingMatch, adminMoveUpcomingToPlayed, getAllVenues } from '../api/api';

const AdminDashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [newTournament, setNewTournament] = useState({ tr_id: '', tr_name: '', start_date: '', end_date: '' });
  const [addTeamData, setAddTeamData] = useState({ trId: '', team_id: '', team_group: '' });
  const [setCaptainData, setSetCaptainData] = useState({ trId: '', teamId: '', playerId: '' });
  const [approvePlayerData, setApprovePlayerData] = useState({ trId: '', teamId: '', playerId: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTournamentForMatches, setSelectedTournamentForMatches] = useState('');
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [newUpcomingMatch, setNewUpcomingMatch] = useState({ match_no: '', play_date: '', play_stage: '', venue_id: '', team_id1: '', team_id2: '' });
  const [moveToPlayed, setMoveToPlayed] = useState({}); // { [match_no]: { results, decided_by, goal_score, audience, player_of_match } }
  const stageOptions = [
    { value: 'G', label: 'Group (G)' },
    { value: 'R', label: 'Round of 16 (R)' },
    { value: 'Q', label: 'Quarterfinal (Q)' },
    { value: 'S', label: 'Semifinal (S)' },
    { value: 'F', label: 'Final (F)' },
  ];
  const [editingMatchNo, setEditingMatchNo] = useState(null);
  const [editUpcomingMatch, setEditUpcomingMatch] = useState({ match_no: '', play_date: '', play_stage: '', venue_id: '', team_id1: '', team_id2: '' });
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
    if (user && user.role === 'admin') {
        fetchData();
    }
  }, [user, isLoading, navigate]);

  const fetchData = async () => {
     try {
        const [tournamentsData, teamsData, playersData] = await Promise.all([
            getTournaments(),
            getAllTeams(),
            getAllPlayers()
        ]);
        setTournaments(tournamentsData);
        setTeams(teamsData);
        setPlayers(playersData);
        getAllVenues().then(setVenues).catch(() => setVenues([]));
     } catch (err) {
         console.error("Failed to fetch data for admin:", err);
         setError("Failed to load initial data.");
     }
  };

  // Fetch upcoming matches when tournament changes
  useEffect(() => {
    if (selectedTournamentForMatches) {
      adminGetUpcomingMatches(selectedTournamentForMatches).then(setUpcomingMatches).catch(() => setUpcomingMatches([]));
    } else {
      setUpcomingMatches([]);
    }
  }, [selectedTournamentForMatches]);

  const handleAddTournament = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await addTournament(newTournament);
      setMessage('Tournament added successfully!');
      setNewTournament({ tr_id: '', tr_name: '', start_date: '', end_date: '' });
      fetchData();
    } catch (err) {
      setError(`Error adding tournament: ${err.message}`);
    }
  };

   const handleDeleteTournament = async (trId) => {
    setError('');
    setMessage('');
    try {
        if (window.confirm(`Are you sure you want to delete tournament ${trId}? This will delete all related data.`)) {
             await deleteTournament(trId);
             setMessage(`Tournament ${trId} deleted successfully!`);
             fetchData();
        }
    } catch (err) {
        setError(`Error deleting tournament ${trId}: ${err.message}`);
    }
   };

  const handleAddTeamToTournament = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
        await addTeamToTournament(addTeamData.trId, { team_id: addTeamData.team_id, team_group: addTeamData.team_group });
        setMessage(`Team ${addTeamData.team_id} added to Tournament ${addTeamData.trId} successfully!`);
         setAddTeamData({ trId: '', team_id: '', team_group: '' });
    } catch (err) {
         setError(`Error adding team to tournament: ${err.message}`);
    }
  };

   const handleSetCaptain = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
        await setCaptain(setCaptainData.trId, setCaptainData.teamId, setCaptainData.playerId);
        setMessage(`Player ${setCaptainData.playerId} set as captain for Team ${setCaptainData.teamId} in Tournament ${setCaptainData.trId}!`);
         setSetCaptainData({ trId: '', teamId: '', playerId: '' });
    } catch (err) {
         setError(`Error setting captain: ${err.message}`);
    }
   };

   const handleApprovePlayer = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
        await approvePlayer(approvePlayerData.trId, approvePlayerData.teamId, approvePlayerData.playerId);
        setMessage(`Player ${approvePlayerData.playerId} approved and added to Team ${approvePlayerData.teamId} in Tournament ${approvePlayerData.trId}!`);
         setApprovePlayerData({ trId: '', teamId: '', playerId: '' });
    } catch (err) {
         setError(`Error approving player: ${err.message}`);
    }
   };

  const handleAddUpcomingMatch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await adminAddUpcomingMatch(selectedTournamentForMatches, newUpcomingMatch);
      setMessage('Upcoming match added!');
      setNewUpcomingMatch({ match_no: '', play_date: '', play_stage: '', venue_id: '', team_id1: '', team_id2: '' });
      adminGetUpcomingMatches(selectedTournamentForMatches).then(setUpcomingMatches);
    } catch (err) {
      setError('Error adding upcoming match: ' + err.message);
    }
  };

  const handleDeleteUpcomingMatch = async (match_no) => {
    setError('');
    setMessage('');
    try {
      await adminDeleteUpcomingMatch(selectedTournamentForMatches, match_no);
      setMessage('Upcoming match deleted!');
      adminGetUpcomingMatches(selectedTournamentForMatches).then(setUpcomingMatches);
    } catch (err) {
      setError('Error deleting upcoming match: ' + err.message);
    }
  };

  const handleMoveToPlayed = async (match_no, e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await adminMoveUpcomingToPlayed(selectedTournamentForMatches, match_no, moveToPlayed[match_no]);
      setMessage('Match moved to played!');
      setMoveToPlayed((prev) => ({ ...prev, [match_no]: undefined }));
      adminGetUpcomingMatches(selectedTournamentForMatches).then(setUpcomingMatches);
    } catch (err) {
      setError('Error moving match to played: ' + err.message);
    }
  };

  const handleEditUpcomingMatch = (match) => {
    setEditingMatchNo(match.match_no);
    setEditUpcomingMatch({
      match_no: match.match_no,
      play_date: match.play_date ? match.play_date.split('T')[0] : '',
      play_stage: match.play_stage,
      venue_id: match.venue_id || '',
      team_id1: match.team_id1 || '',
      team_id2: match.team_id2 || '',
    });
  };

  const handleUpdateUpcomingMatch = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await adminUpdateUpcomingMatch(selectedTournamentForMatches, editingMatchNo, editUpcomingMatch);
      setMessage('Upcoming match updated!');
      setEditingMatchNo(null);
      setEditUpcomingMatch({ match_no: '', play_date: '', play_stage: '', venue_id: '', team_id1: '', team_id2: '' });
      adminGetUpcomingMatches(selectedTournamentForMatches).then(setUpcomingMatches);
    } catch (err) {
      setError('Error updating upcoming match: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingMatchNo(null);
    setEditUpcomingMatch({ match_no: '', play_date: '', play_stage: '', venue_id: '', team_id1: '', team_id2: '' });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {message && <div className="alert alert-success mt-3">{message}</div>}

      <h3 className="mt-4">Add New Tournament</h3>
      <form onSubmit={handleAddTournament}>
         <div className="row g-3">
             <div className="col-md-2">
                 <input type="number" className="form-control" placeholder="ID" value={newTournament.tr_id} onChange={e => setNewTournament({...newTournament, tr_id: e.target.value})} required />
             </div>
              <div className="col-md-4">
                 <input type="text" className="form-control" placeholder="Name" value={newTournament.tr_name} onChange={e => setNewTournament({...newTournament, tr_name: e.target.value})} required />
              </div>
             <div className="col-md-3">
                 <input type="date" className="form-control" placeholder="Start Date" value={newTournament.start_date} onChange={e => setNewTournament({...newTournament, start_date: e.target.value})} required />
             </div>
             <div className="col-md-3">
                 <input type="date" className="form-control" placeholder="End Date" value={newTournament.end_date} onChange={e => setNewTournament({...newTournament, end_date: e.target.value})} required />
             </div>
              <div className="col-12">
                 <button type="submit" className="btn btn-primary">Add Tournament</button>
              </div>
         </div>
      </form>

       <h3 className="mt-4">Existing Tournaments</h3>
       <ul className="list-group">
        {tournaments.map(tourn => (
            <li key={tourn.tr_id} className="list-group-item d-flex justify-content-between align-items-center">
                {tourn.tr_name} ({tourn.tr_id}) - {tourn.start_date} to {tourn.end_date}
                <button onClick={() => handleDeleteTournament(tourn.tr_id)} className="btn btn-danger btn-sm">Delete</button>
            </li>
        ))}
       </ul>


      <h3 className="mt-4">Add Team to Tournament</h3>
      <form onSubmit={handleAddTeamToTournament}>
          <div className="row g-3">
             <div className="col-md-4">
                 <select className="form-select" value={addTeamData.trId} onChange={e => setAddTeamData({...addTeamData, trId: e.target.value})} required>
                     <option value="">Select Tournament</option>
                     {tournaments.map(t => <option key={t.tr_id} value={t.tr_id}>{t.tr_name} ({t.tr_id})</option>)}
                 </select>
             </div>
              <div className="col-md-4">
                  <select className="form-select" value={addTeamData.team_id} onChange={e => setAddTeamData({...addTeamData, team_id: e.target.value})} required>
                     <option value="">Select Team</option>
                     {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name} ({t.team_id})</option>)}
                 </select>
             </div>
             <div className="col-md-2">
                 <input type="text" className="form-control" placeholder="Group (e.g., A)" value={addTeamData.team_group} onChange={e => setAddTeamData({...addTeamData, team_group: e.target.value})} required />
             </div>
              <div className="col-12">
                  <button type="submit" className="btn btn-primary">Add Team</button>
              </div>
          </div>
      </form>

      <h3 className="mt-4">Select Captain for Team in Tournament</h3>
       <form onSubmit={handleSetCaptain}>
           <div className="row g-3">
              <div className="col-md-4">
                 <select className="form-select" value={setCaptainData.trId} onChange={e => setSetCaptainData({...setCaptainData, trId: e.target.value})} required>
                     <option value="">Select Tournament</option>
                     {tournaments.map(t => <option key={t.tr_id} value={t.tr_id}>{t.tr_name} ({t.tr_id})</option>)}
                 </select>
              </div>
               <div className="col-md-4">
                   <select className="form-select" value={setCaptainData.teamId} onChange={e => setSetCaptainData({...setCaptainData, teamId: e.target.value})} required>
                     <option value="">Select Team</option>
                     {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name} ({t.team_id})</option>)}
                 </select>
               </div>
               <div className="col-md-4">
                   <select className="form-select" value={setCaptainData.playerId} onChange={e => setSetCaptainData({...setCaptainData, playerId: e.target.value})} required>
                     <option value="">Select Player</option>
                     {players.map(p => <option key={p.kfupm_id} value={p.kfupm_id}>{p.name} ({p.kfupm_id})</option>)}
                 </select>
               </div>
                <div className="col-12">
                 <button type="submit" className="btn btn-primary">Set Captain</button>
               </div>
           </div>
      </form>

       <h3 className="mt-4">Approve Player for Team in Tournament</h3>
       <form onSubmit={handleApprovePlayer}>
           <div className="row g-3">
              <div className="col-md-4">
                 <select className="form-select" value={approvePlayerData.trId} onChange={e => setApprovePlayerData({...approvePlayerData, trId: e.target.value})} required>
                     <option value="">Select Tournament</option>
                     {tournaments.map(t => <option key={t.tr_id} value={t.tr_id}>{t.tr_name} ({t.tr_id})</option>)}
                 </select>
              </div>
               <div className="col-md-4">
                   <select className="form-select" value={approvePlayerData.teamId} onChange={e => setApprovePlayerData({...approvePlayerData, teamId: e.target.value})} required>
                     <option value="">Select Team</option>
                     {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name} ({t.team_id})</option>)}
                 </select>
               </div>
               <div className="col-md-4">
                   <select className="form-select" value={approvePlayerData.playerId} onChange={e => setApprovePlayerData({...approvePlayerData, playerId: e.target.value})} required>
                     <option value="">Select Player</option>
                     {players.map(p => <option key={p.kfupm_id} value={p.kfupm_id}>{p.name} ({p.kfupm_id})</option>)}
                 </select>
               </div>
               <div className="col-12">
                 <button type="submit" className="btn btn-primary">Approve Player</button>
               </div>
           </div>
      </form>

      {/* Upcoming Matches Management */}
      <div className="mt-5">
        <h3>Manage Upcoming Matches</h3>
        <div className="mb-3">
          <select className="form-select w-auto d-inline-block" value={selectedTournamentForMatches} onChange={e => setSelectedTournamentForMatches(e.target.value)}>
            <option value="">Select Tournament</option>
            {tournaments.map(t => <option key={t.tr_id} value={t.tr_id}>{t.tr_name} ({t.tr_id})</option>)}
          </select>
        </div>
        {selectedTournamentForMatches && (
          <>
            <form className="mb-4" onSubmit={handleAddUpcomingMatch}>
              <div className="row g-2 align-items-end">
                <div className="col-md-1"><input type="number" className="form-control" placeholder="Match #" value={newUpcomingMatch.match_no} onChange={e => setNewUpcomingMatch({ ...newUpcomingMatch, match_no: e.target.value })} required /></div>
                <div className="col-md-2"><input type="date" className="form-control" placeholder="Date" value={newUpcomingMatch.play_date} onChange={e => setNewUpcomingMatch({ ...newUpcomingMatch, play_date: e.target.value })} required /></div>
                <div className="col-md-1">
                  <select className="form-select" value={newUpcomingMatch.play_stage} onChange={e => setNewUpcomingMatch({ ...newUpcomingMatch, play_stage: e.target.value })} required>
                    <option value="">Stage</option>
                    {stageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <select className="form-select" value={newUpcomingMatch.venue_id} onChange={e => setNewUpcomingMatch({ ...newUpcomingMatch, venue_id: e.target.value })} required>
                    <option value="">Select Venue</option>
                    {venues.map(v => <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>)}
                  </select>
                </div>
                <div className="col-md-2"><select className="form-select" value={newUpcomingMatch.team_id1} onChange={e => setNewUpcomingMatch({ ...newUpcomingMatch, team_id1: e.target.value })} required><option value="">Team 1</option>{teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}</select></div>
                <div className="col-md-2"><select className="form-select" value={newUpcomingMatch.team_id2} onChange={e => setNewUpcomingMatch({ ...newUpcomingMatch, team_id2: e.target.value })} required><option value="">Team 2</option>{teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}</select></div>
                <div className="col-md-2"><button type="submit" className="btn btn-success">Add Upcoming Match</button></div>
              </div>
            </form>
            <ul className="list-group">
              {upcomingMatches.map(match => (
                <li key={match.match_no} className="list-group-item mb-2">
                  {editingMatchNo === match.match_no ? (
                    <form className="mb-2" onSubmit={handleUpdateUpcomingMatch}>
                      <div className="row g-2 align-items-end">
                        <div className="col-md-1"><input type="number" className="form-control" value={editUpcomingMatch.match_no} disabled /></div>
                        <div className="col-md-2"><input type="date" className="form-control" value={editUpcomingMatch.play_date} onChange={e => setEditUpcomingMatch({ ...editUpcomingMatch, play_date: e.target.value })} required /></div>
                        <div className="col-md-1">
                          <select className="form-select" value={editUpcomingMatch.play_stage} onChange={e => setEditUpcomingMatch({ ...editUpcomingMatch, play_stage: e.target.value })} required>
                            <option value="">Stage</option>
                            {stageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="col-md-2">
                          <select className="form-select" value={editUpcomingMatch.venue_id} onChange={e => setEditUpcomingMatch({ ...editUpcomingMatch, venue_id: e.target.value })} required>
                            <option value="">Select Venue</option>
                            {venues.map(v => <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>)}
                          </select>
                        </div>
                        <div className="col-md-2"><select className="form-select" value={editUpcomingMatch.team_id1} onChange={e => setEditUpcomingMatch({ ...editUpcomingMatch, team_id1: e.target.value })} required><option value="">Team 1</option>{teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}</select></div>
                        <div className="col-md-2"><select className="form-select" value={editUpcomingMatch.team_id2} onChange={e => setEditUpcomingMatch({ ...editUpcomingMatch, team_id2: e.target.value })} required><option value="">Team 2</option>{teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}</select></div>
                        <div className="col-md-2 d-flex gap-2">
                          <button type="submit" className="btn btn-primary">Save</button>
                          <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <b>Match #{match.match_no}</b> | {match.team1_name} vs {match.team2_name} | {match.play_date} | {match.venue_name} | Stage: {match.play_stage}
                      </div>
                      <div>
                        <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditUpcomingMatch(match)}>Edit</button>
                        <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteUpcomingMatch(match.match_no)}>Delete</button>
                      </div>
                    </div>
                  )}
                  {/* Move to Played Form */}
                  {editingMatchNo !== match.match_no && (
                    <form className="mt-2" onSubmit={e => handleMoveToPlayed(match.match_no, e)}>
                      <div className="row g-2 align-items-end">
                        <div className="col-md-2">
                          <input type="text" className="form-control" placeholder="Decided By (N/P)" value={moveToPlayed[match.match_no]?.decided_by || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], decided_by: e.target.value } }))} required />
                        </div>
                        <div className="col-md-2">
                          <input type="text" className="form-control" placeholder="Goal Score (e.g. 2-1)" value={moveToPlayed[match.match_no]?.goal_score || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], goal_score: e.target.value } }))} required />
                        </div>
                        <div className="col-md-2 d-flex align-items-center">
                          <span><b>Venue:</b> {match.venue_name}</span>
                        </div>
                        <div className="col-md-1">
                          <input type="number" className="form-control" placeholder="Audience" value={moveToPlayed[match.match_no]?.audience || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], audience: e.target.value } }))} required />
                        </div>
                        <div className="col-md-2">
                          <input type="text" className="form-control" placeholder="Player of Match (ID)" value={moveToPlayed[match.match_no]?.player_of_match || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], player_of_match: e.target.value } }))} required />
                        </div>
                        <div className="col-md-1">
                          <input type="number" className="form-control" placeholder="Stop1 Sec" value={moveToPlayed[match.match_no]?.stop1_sec || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], stop1_sec: e.target.value } }))} required />
                        </div>
                        <div className="col-md-1">
                          <input type="number" className="form-control" placeholder="Stop2 Sec" value={moveToPlayed[match.match_no]?.stop2_sec || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], stop2_sec: e.target.value } }))} required />
                        </div>
                      </div>
                      <div className="row g-2 align-items-end mt-2">
                        <div className="col-md-12"><b>Team 1 ({match.team1_name})</b></div>
                        <div className="col-md-2">
                          <select className="form-select" value={moveToPlayed[match.match_no]?.team1_win_lose || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], team1_win_lose: e.target.value } }))} required>
                            <option value="">Win/Lose/Draw</option>
                            <option value="W">Win</option>
                            <option value="L">Lose</option>
                            <option value="D">Draw</option>
                          </select>
                        </div>
                        <div className="col-md-2">
                          <input type="number" className="form-control" placeholder="Penalty Score" value={moveToPlayed[match.match_no]?.team1_penalty_score || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], team1_penalty_score: e.target.value } }))} required />
                        </div>
                        <div className="col-md-3">
                          <input type="text" className="form-control" placeholder="Goalkeeper (ID)" value={moveToPlayed[match.match_no]?.team1_player_gk || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], team1_player_gk: e.target.value } }))} required />
                        </div>
                        <div className="col-md-12 mt-2"><b>Team 2 ({match.team2_name})</b></div>
                        <div className="col-md-2">
                          <select className="form-select" value={moveToPlayed[match.match_no]?.team2_win_lose || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], team2_win_lose: e.target.value } }))} required>
                            <option value="">Win/Lose/Draw</option>
                            <option value="W">Win</option>
                            <option value="L">Lose</option>
                            <option value="D">Draw</option>
                          </select>
                        </div>
                        <div className="col-md-2">
                          <input type="number" className="form-control" placeholder="Penalty Score" value={moveToPlayed[match.match_no]?.team2_penalty_score || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], team2_penalty_score: e.target.value } }))} required />
                        </div>
                        <div className="col-md-3">
                          <input type="text" className="form-control" placeholder="Goalkeeper (ID)" value={moveToPlayed[match.match_no]?.team2_player_gk || ''} onChange={e => setMoveToPlayed(prev => ({ ...prev, [match.match_no]: { ...prev[match.match_no], team2_player_gk: e.target.value } }))} required />
                        </div>
                        <div className="col-md-2">
                          <button type="submit" className="btn btn-primary">Mark as Played</button>
                        </div>
                      </div>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;