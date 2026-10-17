import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';

export default function useDisciplines() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API}/disciplines`)
      .then(response => {
        if (!response.ok) throw new Error(`Unable to load disciplines (${response.status})`);
        return response.json();
      })
      .then(data => { if (active) setRecords(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setRecords([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return {
    records,
    loading,
    values: records.map(item => item.code),
    names: records.map(item => item.name),
    options: records.map(item => ({ value: item.code, label: item.name })),
  };
}
