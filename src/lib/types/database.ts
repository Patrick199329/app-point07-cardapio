export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      avisos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          ordem: number
          texto: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          ordem?: number
          texto: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          ordem?: number
          texto?: string
          updated_at?: string
        }
        Relationships: []
      }
      cardapio_config: {
        Row: {
          arredondamento: Database["public"]["Enums"]["cardapio_arredondamento"]
          categorias_centralizadas: boolean
          cor_bloco: string
          cor_categoria_nav_fundo: string
          cor_categoria_nav_fundo_ativa: string
          cor_destaque: string
          cor_fundo: string
          cor_fundo_cabecalho: string
          cor_texto_cabecalho: string
          id: number
          logo_path: string | null
          logo_posicao: Database["public"]["Enums"]["cardapio_logo_posicao"]
          logo_tamanho: Database["public"]["Enums"]["cardapio_logo_tamanho"]
          mostrar_nome_com_logo: boolean
          nome_estabelecimento: string
          sombra: boolean
          updated_at: string
        }
        Insert: {
          arredondamento?: Database["public"]["Enums"]["cardapio_arredondamento"]
          categorias_centralizadas?: boolean
          cor_bloco?: string
          cor_categoria_nav_fundo?: string
          cor_categoria_nav_fundo_ativa?: string
          cor_destaque?: string
          cor_fundo?: string
          cor_fundo_cabecalho?: string
          cor_texto_cabecalho?: string
          id?: number
          logo_path?: string | null
          logo_posicao?: Database["public"]["Enums"]["cardapio_logo_posicao"]
          logo_tamanho?: Database["public"]["Enums"]["cardapio_logo_tamanho"]
          mostrar_nome_com_logo?: boolean
          nome_estabelecimento?: string
          sombra?: boolean
          updated_at?: string
        }
        Update: {
          arredondamento?: Database["public"]["Enums"]["cardapio_arredondamento"]
          categorias_centralizadas?: boolean
          cor_bloco?: string
          cor_categoria_nav_fundo?: string
          cor_categoria_nav_fundo_ativa?: string
          cor_destaque?: string
          cor_fundo?: string
          cor_fundo_cabecalho?: string
          cor_texto_cabecalho?: string
          id?: number
          logo_path?: string | null
          logo_posicao?: Database["public"]["Enums"]["cardapio_logo_posicao"]
          logo_tamanho?: Database["public"]["Enums"]["cardapio_logo_tamanho"]
          mostrar_nome_com_logo?: boolean
          nome_estabelecimento?: string
          sombra?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      chamados: {
        Row: {
          aceito_em: string | null
          cancelado_em: string | null
          created_at: string
          criado_em: string
          garcom_id: string | null
          id: string
          mesa_id: string
          origem_token: string
          status: Database["public"]["Enums"]["chamado_status"]
          updated_at: string
        }
        Insert: {
          aceito_em?: string | null
          cancelado_em?: string | null
          created_at?: string
          criado_em?: string
          garcom_id?: string | null
          id?: string
          mesa_id: string
          origem_token?: string
          status?: Database["public"]["Enums"]["chamado_status"]
          updated_at?: string
        }
        Update: {
          aceito_em?: string | null
          cancelado_em?: string | null
          created_at?: string
          criado_em?: string
          garcom_id?: string | null
          id?: string
          mesa_id?: string
          origem_token?: string
          status?: Database["public"]["Enums"]["chamado_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_garcom_id_fkey"
            columns: ["garcom_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_config: {
        Row: {
          alerta_atraso_segundos: number
          id: number
          updated_at: string
        }
        Insert: {
          alerta_atraso_segundos?: number
          id?: number
          updated_at?: string
        }
        Update: {
          alerta_atraso_segundos?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      mesas: {
        Row: {
          apelido: string | null
          area: Database["public"]["Enums"]["mesa_area"]
          ativo: boolean
          created_at: string
          id: string
          identificador: string
          qr_token: string
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          area?: Database["public"]["Enums"]["mesa_area"]
          ativo?: boolean
          created_at?: string
          id?: string
          identificador: string
          qr_token?: string
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          area?: Database["public"]["Enums"]["mesa_area"]
          ativo?: boolean
          created_at?: string
          id?: string
          identificador?: string
          qr_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      produto_grupos_opcoes: {
        Row: {
          created_at: string
          id: string
          observacao: string | null
          ordem: number
          produto_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacao?: string | null
          ordem?: number
          produto_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          observacao?: string | null
          ordem?: number
          produto_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_grupos_opcoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_opcoes: {
        Row: {
          created_at: string
          grupo_id: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          grupo_id: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          grupo_id?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "produto_opcoes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "produto_grupos_opcoes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string
          created_at: string
          descricao: string | null
          id: string
          imagem_layout: Database["public"]["Enums"]["produto_imagem_layout"]
          imagem_path: string | null
          modelo: Database["public"]["Enums"]["produto_modelo"]
          nome: string
          ordem: number
          preco: number | null
          preco_grande: number | null
          preco_grande_label: string | null
          preco_medio: number | null
          preco_medio_label: string | null
          serve_ate: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_layout?: Database["public"]["Enums"]["produto_imagem_layout"]
          imagem_path?: string | null
          modelo?: Database["public"]["Enums"]["produto_modelo"]
          nome: string
          ordem?: number
          preco?: number | null
          preco_grande?: number | null
          preco_grande_label?: string | null
          preco_medio?: number | null
          preco_medio_label?: string | null
          serve_ate?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_layout?: Database["public"]["Enums"]["produto_imagem_layout"]
          imagem_path?: string | null
          modelo?: Database["public"]["Enums"]["produto_modelo"]
          nome?: string
          ordem?: number
          preco?: number | null
          preco_grande?: number | null
          preco_grande_label?: string | null
          preco_medio?: number | null
          preco_medio_label?: string | null
          serve_ate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      push_inscricoes: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_inscricoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sistema_config: {
        Row: {
          id: number
          logo_path: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          logo_path?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          logo_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_chamado: {
        Args: { p_id: string }
        Returns: {
          motivo: string
          ok: boolean
        }[]
      }
      cancelar_chamado: {
        Args: { p_id: string; p_origem_token: string }
        Returns: boolean
      }
      criar_chamado: {
        Args: { p_token: string }
        Returns: {
          chamado_id: string
          ja_existia: boolean
          origem_token: string
          status: Database["public"]["Enums"]["chamado_status"]
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_garcom: { Args: never; Returns: boolean }
      mesa_por_token: {
        Args: { p_token: string }
        Returns: {
          id: string
          identificador: string
        }[]
      }
      status_chamado: {
        Args: { p_id: string; p_origem_token: string }
        Returns: {
          aceito_em: string
          garcom_nome: string
          status: Database["public"]["Enums"]["chamado_status"]
        }[]
      }
    }
    Enums: {
      cardapio_arredondamento: "nenhum" | "pequeno" | "medio" | "grande"
      cardapio_logo_posicao: "esquerda" | "centro" | "direita"
      cardapio_logo_tamanho: "pequeno" | "medio" | "grande"
      chamado_status: "pendente" | "aceito" | "cancelado"
      mesa_area: "interna" | "externa"
      produto_imagem_layout: "miniatura" | "grande"
      produto_modelo: "simples" | "tamanhos" | "compartilhar"
      user_role: "admin" | "garcom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cardapio_arredondamento: ["nenhum", "pequeno", "medio", "grande"],
      cardapio_logo_posicao: ["esquerda", "centro", "direita"],
      cardapio_logo_tamanho: ["pequeno", "medio", "grande"],
      chamado_status: ["pendente", "aceito", "cancelado"],
      mesa_area: ["interna", "externa"],
      produto_imagem_layout: ["miniatura", "grande"],
      produto_modelo: ["simples", "tamanhos", "compartilhar"],
      user_role: ["admin", "garcom"],
    },
  },
} as const

