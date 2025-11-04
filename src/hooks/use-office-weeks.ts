import { supabase } from "@/integrations/supabase/client";
import { OfficeWeek } from "@/types/schedule";

export const useOfficeWeeks = () => {
  const fetchOfficeWeeks = async (year: number, weekNumber?: number) => {
    let query = supabase
      .from('office_weeks')
      .select('*')
      .eq('year', year);
    
    if (weekNumber) {
      query = query.eq('week_number', weekNumber);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching office weeks:', error);
      throw error;
    }
    
    return data as OfficeWeek[];
  };

  const toggleOfficeWeek = async (userId: string, weekNumber: number, year: number) => {
    // Check if office week exists
    const { data: existing } = await supabase
      .from('office_weeks')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .maybeSingle();

    if (existing) {
      // Delete if exists
      const { error } = await supabase
        .from('office_weeks')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return null;
    } else {
      // Insert if doesn't exist
      const { data, error } = await supabase
        .from('office_weeks')
        .insert({
          user_id: userId,
          week_number: weekNumber,
          year: year,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as OfficeWeek;
    }
  };

  const getOfficeWeeksForUser = async (userId: string, year: number) => {
    const { data, error } = await supabase
      .from('office_weeks')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('week_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching user office weeks:', error);
      throw error;
    }
    
    return data as OfficeWeek[];
  };

  return {
    fetchOfficeWeeks,
    toggleOfficeWeek,
    getOfficeWeeksForUser,
  };
};
