import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUpcomingMatches } from '../api/api';

const UpcomingMatchesPage = () => {
    const { trId } = useParams();
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'guest')) {
            navigate('/');
            return;
        }

        const fetchMatches = async () => {
            try {
                setLoading(true);
                const data = await getUpcomingMatches(trId);
                setMatches(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching upcoming matches:', err);
                setError('Failed to load upcoming matches. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role === 'guest') {
            fetchMatches();
        }
    }, [trId, user, isLoading, navigate]);

    if (isLoading || loading) {
        return (
            <div className="d-flex justify-content-center mt-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Upcoming Matches</h1>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate('/guest')}
                >
                    Back to Dashboard
                </button>
            </div>

            {matches.length === 0 ? (
                <div className="alert alert-info">
                    No upcoming matches found for this tournament.
                </div>
            ) : (
                <div className="row">
                    {matches.map((match) => (
                        <div key={`${match.match_no}-${match.tr_id}`} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100">
                                <div className="card-header bg-primary text-white">
                                    <h5 className="card-title mb-0">Match #{match.match_no}</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="text-center flex-grow-1">
                                            <h6 className="mb-1">{match.team1_name}</h6>
                                            <span className="badge bg-secondary">vs</span>
                                        </div>
                                        <div className="text-center flex-grow-1">
                                            <h6 className="mb-1">{match.team2_name}</h6>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="mb-1">
                                            <i className="bi bi-calendar-event me-2"></i>
                                            {match.play_date ? new Date(match.play_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}
                                        </p>
                                        <p className="mb-0">
                                            <i className="bi bi-geo-alt me-2"></i>
                                            {match.venue_name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UpcomingMatchesPage; 