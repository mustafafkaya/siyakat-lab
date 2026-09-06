"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFacets,
  listSamples,
  type Sample,
  type SampleFacets,
  type SampleFilters,
} from "@/lib/api";

/**
 * Atlas ve arama sayfalarının ortak veri kancası:
 * filtre değiştikçe `GET /samples` + `GET /samples/facets` çağırır.
 * Metin araması için küçük bir gecikme (debounce) uygular.
 */
export function useSamples(initial: SampleFilters = {}, debounceMs = 300) {
  const [filters, setFilters] = useState<SampleFilters>(initial);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [facets, setFacets] = useState<SampleFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async (f: SampleFilters) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const [list, fc] = await Promise.all([listSamples(f), getFacets(f)]);
      if (id !== reqId.current) return; // eski istek: yoksay
      setSamples(list);
      setFacets(fc);
    } catch (e: any) {
      if (id !== reqId.current) return;
      setError(e?.message || "Veri alınamadı. API çalışıyor mu?");
      setSamples([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(filters), filters.query ? debounceMs : 0);
    return () => clearTimeout(t);
  }, [filters, load, debounceMs]);

  return {
    filters,
    setFilters,
    samples,
    facets,
    loading,
    error,
    reload: () => load(filters),
  };
}
