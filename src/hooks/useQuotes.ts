// src/hooks/useQuotes.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "lib/supabase";
import { QuoteRequest } from "types";

export function useQuotes(partnerId: string | undefined) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*, design_files(*)")
      .eq("partner_id", partnerId)
      .order("submitted_at", { ascending: false });

    if (error) setError(error.message);
    else setQuotes((data as QuoteRequest[]) || []);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
}
