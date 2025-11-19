import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to user management page where all admin functionality is now
    navigate('/admin/users');
  }, [navigate]);

  return null;
}
