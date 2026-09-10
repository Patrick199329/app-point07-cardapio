/**
 * Tipos do schema do banco.
 *
 * ⚠️ Arquivo provisório escrito à mão a partir das migrations. Após subir o
 * Supabase local, regenerar com:
 *   npm run db:types
 * (npx supabase gen types typescript --local > src/lib/types/database.ts)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          role: Database["public"]["Enums"]["user_role"];
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome: string;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mesas: {
        Row: {
          id: string;
          identificador: string;
          apelido: string | null;
          area: Database["public"]["Enums"]["mesa_area"];
          ativo: boolean;
          qr_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          identificador: string;
          apelido?: string | null;
          area?: Database["public"]["Enums"]["mesa_area"];
          ativo?: boolean;
          qr_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          identificador?: string;
          apelido?: string | null;
          area?: Database["public"]["Enums"]["mesa_area"];
          ativo?: boolean;
          qr_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "admin" | "garcom";
      mesa_area: "interna" | "externa";
    };
    CompositeTypes: Record<never, never>;
  };
};
