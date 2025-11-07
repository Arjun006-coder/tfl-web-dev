"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/realtime';

type Stat = {
  id: number;
  timestamp: string;
  avg_wait_time: number | null;
  total_vehicles_today: number | null;
};

export default function Charts() {
  const [stats, setStats] = useState<Stat[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('stats')
        .select('id,timestamp,avg_wait_time,total_vehicles_today')
        .order('timestamp', { ascending: false })
        .limit(50);
      setStats(data || []);
    })();
  }, []);

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="font-medium mb-2">System Metrics (latest)</div>
      {stats.length === 0 ? (
        <div>No metrics yet</div>
      ) : (
        <ul className="space-y-1">
          {stats.slice(0, 5).map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
              <span>Avg wait: {s.avg_wait_time ?? '-'} s</span>
              <span>Total: {s.total_vehicles_today ?? '-'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

















