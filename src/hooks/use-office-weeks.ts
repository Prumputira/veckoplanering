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

  const setWeekAssignments = async (
    weekNumber: number,
    year: number,
    userIds: string[],
    isClosed: boolean
  ) => {
    // First, delete all existing assignments for this week
    const { error: deleteError } = await supabase
      .from('office_weeks')
      .delete()
      .eq('week_number', weekNumber)
      .eq('year', year);

    if (deleteError) throw deleteError;

    // If week is closed or no users selected, we're done
    if (isClosed || userIds.length === 0) {
      // Insert a single record marking the week as closed
      if (isClosed) {
        const { error: insertError } = await supabase
          .from('office_weeks')
          .insert({
            week_number: weekNumber,
            year: year,
            user_id: userIds[0] || '00000000-0000-0000-0000-000000000000', // placeholder
            is_closed: true,
          });
        
        if (insertError) throw insertError;
      }
      return;
    }

    // Insert new assignments for each user
    const assignments = userIds.map(userId => ({
      user_id: userId,
      week_number: weekNumber,
      year: year,
      is_closed: false,
    }));

    const { error: insertError } = await supabase
      .from('office_weeks')
      .insert(assignments);

    if (insertError) throw insertError;
  };

  const getWeekAssignments = async (weekNumber: number, year: number) => {
    const { data, error } = await supabase
      .from('office_weeks')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('year', year);

    if (error) throw error;

    const isClosed = data && data.length > 0 ? data[0].is_closed : false;
    const userIds = isClosed ? [] : data?.map(row => row.user_id) || [];

    return {
      userIds,
      isClosed,
    };
  };

  return {
    fetchOfficeWeeks,
    toggleOfficeWeek,
    getOfficeWeeksForUser,
    setWeekAssignments,
    getWeekAssignments,
  };
};
