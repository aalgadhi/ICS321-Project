import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeamMembers } from '../api/api';

const TeamMembersPage = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const { teamId, trId } = useParams();
    const [members, setMembers] = useState([]);
    const [error, setError] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'guest')) {
            navigate('/');
        }
         if (user && teamId && trId) {
             fetchTeamMembers(teamId, trId);
         } else if (!isLoading && (!teamId || !trId)) {
             setError("Team ID or Tournament ID is missing in the URL.");
             setLoadingMembers(false);
         }
    }, [user, isLoading, navigate, teamId, trId]);


    const fetchTeamMembers = async (teamId, trId) => {
         setLoadingMembers(true);
         setError('');
         try {
             const data = await getTeamMembers(teamId, trId);
             setMembers(data);
         } catch (err) {
              setError(`Failed to load team members: ${err.message}`);
              setMembers([]);
         } finally {
            setLoadingMembers(false);
         }
    };


    if (isLoading || loadingMembers) {
        return <div>Loading...</div>;
   }

   if (!user) {
       return null;
   }

    return (
        <div>
            <h1>Team Members</h1>
            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {!error && members.length > 0 ? (
                 <div className="table-responsive">
                     <table className="table table-striped table-bordered table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.kfupm_id}>
                                    <td>{member.kfupm_id}</td>
                                    <td>{member.name}</td>
                                    <td>{member.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            ) : (
                !error && <p>No members found for this team and tournament.</p>
            )}
        </div>
    );
};

export default TeamMembersPage;