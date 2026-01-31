
import { useState, useEffect } from 'react';
import { supabase, MASTER_PROGRAM_TABLE } from '../utils/supabase';
import { MasterProgramEntry } from '../types';

export const useMasterProgram = () => {
  const [masterProgram, setMasterProgram] = useState<MasterProgramEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const { data, error } = await supabase
          .from(MASTER_PROGRAM_TABLE)
          .select('*')
          .order('id', { ascending: true });
          
        if (error) {
          console.error('Error fetching master program:', error);
          return;
        }

        if (data) {
          setMasterProgram(data as MasterProgramEntry[]);
        }
      } catch (e) {
        console.error('Exception fetching master program:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgram();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:master_program')
      .on('postgres_changes', { event: '*', schema: 'public', table: MASTER_PROGRAM_TABLE }, () => {
        fetchProgram();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { masterProgram, isLoading };
};
