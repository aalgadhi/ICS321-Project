import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addTournament, getTournaments, deleteTournament, getAllTeams, getAllPlayers, addTeamToTournament, setCaptain, approvePlayer } from '../api/api';

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
     } catch (err) {
         console.error("Failed to fetch data for admin:", err);
         setError("Failed to load initial data.");
     }
  };


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

    </div>
  );
};

export default AdminDashboard;