
import { useState, useEffect, useCallback } from 'react';
import { ProductionEntry } from '../types';
import { DRAFT_KEY } from '../constants';
import { supabase, TABLE_NAME } from '../utils/supabase';

export const useProductionData = () => {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [draft, setDraft] = useState<Partial<ProductionEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // JOIN production_entries with production_orders
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          orders:production_orders(*)
        `)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Data Fetch Error:", error.message);
      } else {
        if (data) {
          setEntries(data as ProductionEntry[]);
        }
      }
    } catch (err) {
      console.error("Connection Exception:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        setDraft(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Draft parsing failed", e);
      }
    }

    const channel = supabase
      .channel('public:production_entries')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const addEntry = useCallback(async (entryData: Omit<ProductionEntry, 'id' | 'submitted_at' | 'total_tonnage' | 'total_orders'>) => {
    try {
      // 1. Insert Parent Entry
      const { data: entryResult, error: entryError } = await supabase
        .from(TABLE_NAME)
        .insert([{
          entry_date: entryData.entry_date,
          shift: entryData.shift,
          platform: entryData.platform,
          operator_name: entryData.operator_name,
          notes: entryData.notes,
          submitted_at: new Date().toISOString()
          // total_tonnage and total_orders are handled by DB triggers/functions ideally, 
          // or calculated on fetch if not.
        }])
        .select()
        .single();

      if (entryError) throw entryError;
      if (!entryResult) throw new Error("Entry insertion failed to return data");

      const newEntryId = entryResult.id;

      // 2. Insert Child Orders
      if (entryData.orders && entryData.orders.length > 0) {
        const ordersToInsert = entryData.orders.map(o => ({
          entry_id: newEntryId,
          order_type: o.order_type,
          article_code: o.article_code,
          ops_name: o.ops_name,
          dossier_number: o.dossier_number,
          sap_code: o.sap_code,
          maritime_agent: o.maritime_agent,
          bl_number: o.bl_number,
          tc_number: o.tc_number,
          seal_number: o.seal_number,
          truck_matricule: o.truck_matricule,
          order_count: o.order_count,
          configured_columns: o.configured_columns,
          unit_weight: o.unit_weight,
          pallet_type: o.pallet_type,
          calculated_tonnage: o.calculated_tonnage
        }));

        const { error: ordersError } = await supabase
          .from('production_orders')
          .insert(ordersToInsert);

        if (ordersError) throw ordersError;
      }

      // 3. Clear local state and refresh
      localStorage.removeItem(DRAFT_KEY);
      setDraft(null);
      await fetchData(); 

    } catch (err: any) {
      console.error("Save Error:", err.message);
      alert(`Database Error: ${err.message}`);
    }
  }, [fetchData]);

  const updateEntry = useCallback(async (updatedEntry: ProductionEntry) => {
    try {
      // Update Parent
      const { error: entryError } = await supabase
        .from(TABLE_NAME)
        .update({
             operator_name: updatedEntry.operator_name,
             entry_date: updatedEntry.entry_date,
             shift: updatedEntry.shift,
             platform: updatedEntry.platform,
             notes: updatedEntry.notes
        })
        .eq('id', updatedEntry.id);

      if (entryError) throw entryError;

      // Update Orders: Delete all and re-insert to handle additions/removals
      const { error: deleteError } = await supabase
        .from('production_orders')
        .delete()
        .eq('entry_id', updatedEntry.id);
        
       if (deleteError) throw deleteError;

       if (updatedEntry.orders && updatedEntry.orders.length > 0) {
         const ordersToInsert = updatedEntry.orders.map(o => ({
          entry_id: updatedEntry.id,
          order_type: o.order_type,
          article_code: o.article_code,
          ops_name: o.ops_name,
          dossier_number: o.dossier_number,
          sap_code: o.sap_code,
          maritime_agent: o.maritime_agent,
          bl_number: o.bl_number,
          tc_number: o.tc_number,
          seal_number: o.seal_number,
          truck_matricule: o.truck_matricule,
          order_count: o.order_count,
          configured_columns: o.configured_columns,
          unit_weight: o.unit_weight,
          pallet_type: o.pallet_type,
          calculated_tonnage: o.calculated_tonnage
        }));

        const { error: insertError } = await supabase
          .from('production_orders')
          .insert(ordersToInsert);

         if (insertError) throw insertError;
       }

      await fetchData();
    } catch (err: any) {
      console.error("Update Error:", err.message);
      alert("Failed to update record.");
    }
  }, [fetchData]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      console.error("Delete Error:", err.message);
      alert("Failed to delete record.");
    }
  }, []);

  const saveDraft = useCallback((draftData: Partial<ProductionEntry>) => {
    setDraft(draftData);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  }, []);

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    draft,
    saveDraft
  };
};
