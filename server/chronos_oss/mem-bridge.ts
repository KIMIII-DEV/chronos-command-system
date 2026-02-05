import { createClient } from '@supabase/supabase-js';

/**
 * CHRONOS OSS - JENA MEMORY (A8.3)
 * Persistent RDF-based structured knowledge storage using Supabase.
 * Replaces in-memory state with a database-backed triple store.
 */

export class JenaMemory {
  private supabase: any;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Sets the Supabase client if not provided in constructor.
   */
  setClient(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Queries the knowledge graph for relevant context from Supabase.
   */
  async query(input: string): Promise<string[]> {
    if (!this.supabase) {
      console.warn("[Jena] Supabase client not initialized. Returning default context.");
      return ["rdf:subject chronos:system", "rdf:predicate chronos:mode", "rdf:object chronos:oss_deterministic"];
    }

    console.log(`[Jena] Querying persistent RDF graph for: ${input}`);
    
    // Semantic search simulation: Fetching triples that might match keywords in input
    const keywords = input.toLowerCase().split(' ').filter(k => k.length > 3);
    
    // Fallback if no keywords are long enough
    if (keywords.length === 0) {
      return ["rdf:subject chronos:system", "rdf:predicate chronos:mode", "rdf:object chronos:oss_deterministic"];
    }

    const { data, error } = await this.supabase
      .from('rdf_triples')
      .select('subject, predicate, object')
      .or(keywords.map(k => `subject.ilike.%${k}%,predicate.ilike.%${k}%,object.ilike.%${k}%`).join(','));

    if (error || !data || data.length === 0) {
      return ["rdf:subject chronos:system", "rdf:predicate chronos:mode", "rdf:object chronos:oss_deterministic"];
    }

    return data.map((t: any) => `${t.subject} ${t.predicate} ${t.object}`);
  }

  /**
   * Stores a new fact in the RDF graph (Supabase).
   */
  async store(triple: { s: string, p: string, o: string }): Promise<void> {
    if (!this.supabase) {
      console.error("[Jena] Cannot store fact: Supabase client not initialized.");
      return;
    }

    const { error } = await this.supabase
      .from('rdf_triples')
      .insert({
        subject: triple.s,
        predicate: triple.p,
        object: triple.o
      });

    if (error) {
      console.error("[Jena] Failed to store RDF triple:", error);
    } else {
      console.log(`[Jena] Persistent fact stored: <${triple.s}> <${triple.p}> <${triple.o}>`);
    }
  }
}
