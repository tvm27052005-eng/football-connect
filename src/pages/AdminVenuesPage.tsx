import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

type VenueStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

interface VenueItem {
  id: string;
  name: string;
  status?: VenueStatus;
}

const AdminVenuesPage = () => {
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVenues = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/venues/admin/all');
      setVenues(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sân:', error);
      setVenues([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchVenues();
  }, []);

  const handleUpdateStatus = async (venueId: string, status: VenueStatus) => {
    try {
      await api.put(`/venues/admin/${venueId}/status`, { status });
      await fetchVenues();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái sân';
      alert(message);
    }
  };

  return (
    <div>
      <h1>Admin Venues Page</h1>

      {isLoading ? (
        <p>Đang tải...</p>
      ) : (
        <ul>
          {venues.map((venue) => (
            <li key={venue.id} style={{ marginBottom: 12 }}>
              <span>
                {venue.name} - {venue.status || 'PENDING'}
              </span>

              {venue.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(venue.id, 'APPROVED')}
                  style={{ marginLeft: 8 }}
                >
                  Approve
                </button>
              )}

              {venue.status !== 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(venue.id, 'REJECTED')}
                  style={{ marginLeft: 8 }}
                >
                  Reject
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminVenuesPage;