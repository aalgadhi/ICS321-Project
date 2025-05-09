import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHighestScorer } from '../api/api';

const HighestScorerPage = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [highestScorer, setHighestScorer] = useState(null);
    const [error, setError] = useState('');
    const [loadingScorer, setLoadingScorer] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'guest')) {
            navigate('/');
        }
         if (user) {
             fetchHighestScorer();
         }
    }, [user, isLoading, navigate]);

    const fetchHighestScorer = async () => {
        setLoadingScorer(true);
        setError('');
        try {
            const data = await getHighestScorer();
            setHighestScorer(data);
        } catch (err) {
             setError(`Failed to load highest scorer: ${err.message}`);
             setHighestScorer(null);
        } finally {
            setLoadingScorer(false);
        }
    };

     if (isLoading || loadingScorer) {
        return <div>Loading...</div>;
   }

   if (!user) {
       return null;
   }

    return (
        <div>
            <h1>Highest Goal Scorer (All Tournaments)</h1>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {highestScorer ? (
                <div>
                    <p><strong>Player:</strong> {highestScorer.name} ({highestScorer.kfupm_id})</p>
                    <p><strong>Total Goals:</strong> {highestScorer.total_goals}</p>
                </div>
            ) : (
                !error && <p>No highest scorer found yet.</p>
            )}
        </div>
    );
};

export default HighestScorerPage;