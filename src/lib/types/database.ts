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
          fixo: boolean
          id: string
          ordem: number
          texto: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          fixo?: boolean
          id?: string
          ordem?: number
          texto: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          fixo?: boolean
          id?: string
          ordem?: number
          texto?: string
          updated_at?: string
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          concluido_em: string | null
          disparado_manualmente: boolean
          drive_arquivo_id: string | null
          drive_arquivo_url: string | null
          id: string
          iniciado_em: string
          mensagem_erro: string | null
          status: string
          tamanho_bytes: number | null
        }
        Insert: {
          concluido_em?: string | null
          disparado_manualmente?: boolean
          drive_arquivo_id?: string | null
          drive_arquivo_url?: string | null
          id?: string
          iniciado_em?: string
          mensagem_erro?: string | null
          status?: string
          tamanho_bytes?: number | null
        }
        Update: {
          concluido_em?: string | null
          disparado_manualmente?: boolean
          drive_arquivo_id?: string | null
          drive_arquivo_url?: string | null
          id?: string
          iniciado_em?: string
          mensagem_erro?: string | null
          status?: string
          tamanho_bytes?: number | null
        }
        Relationships: []
      }
      cardapio_config: {
        Row: {
          agrupar_categorias: boolean
          arredondamento: Database["public"]["Enums"]["cardapio_arredondamento"]
          categorias_centralizadas: boolean
          cor_bloco: string
          cor_categoria_nav_fundo: string
          cor_categoria_nav_fundo_ativa: string
          cor_destaque: string
          cor_fundo: string
          cor_fundo_cabecalho: string
          cor_texto_cabecalho: string
          descricao_caixa: Database["public"]["Enums"]["cardapio_descricao_caixa"]
          id: number
          logo_path: string | null
          logo_posicao: Database["public"]["Enums"]["cardapio_logo_posicao"]
          logo_tamanho: Database["public"]["Enums"]["cardapio_logo_tamanho"]
          mesa_confirmar_apos_minutos: number
          mostrar_nome_com_logo: boolean
          nome_estabelecimento: string
          sombra: boolean
          tamanho_imagem_produto: string
          updated_at: string
        }
        Insert: {
          agrupar_categorias?: boolean
          arredondamento?: Database["public"]["Enums"]["cardapio_arredondamento"]
          categorias_centralizadas?: boolean
          cor_bloco?: string
          cor_categoria_nav_fundo?: string
          cor_categoria_nav_fundo_ativa?: string
          cor_destaque?: string
          cor_fundo?: string
          cor_fundo_cabecalho?: string
          cor_texto_cabecalho?: string
          descricao_caixa?: Database["public"]["Enums"]["cardapio_descricao_caixa"]
          id?: number
          logo_path?: string | null
          logo_posicao?: Database["public"]["Enums"]["cardapio_logo_posicao"]
          logo_tamanho?: Database["public"]["Enums"]["cardapio_logo_tamanho"]
          mesa_confirmar_apos_minutos?: number
          mostrar_nome_com_logo?: boolean
          nome_estabelecimento?: string
          sombra?: boolean
          tamanho_imagem_produto?: string
          updated_at?: string
        }
        Update: {
          agrupar_categorias?: boolean
          arredondamento?: Database["public"]["Enums"]["cardapio_arredondamento"]
          categorias_centralizadas?: boolean
          cor_bloco?: string
          cor_categoria_nav_fundo?: string
          cor_categoria_nav_fundo_ativa?: string
          cor_destaque?: string
          cor_fundo?: string
          cor_fundo_cabecalho?: string
          cor_texto_cabecalho?: string
          descricao_caixa?: Database["public"]["Enums"]["cardapio_descricao_caixa"]
          id?: number
          logo_path?: string | null
          logo_posicao?: Database["public"]["Enums"]["cardapio_logo_posicao"]
          logo_tamanho?: Database["public"]["Enums"]["cardapio_logo_tamanho"]
          mesa_confirmar_apos_minutos?: number
          mostrar_nome_com_logo?: boolean
          nome_estabelecimento?: string
          sombra?: boolean
          tamanho_imagem_produto?: string
          updated_at?: string
        }
        Relationships: []
      }
      cardapio_publicado: {
        Row: {
          dados: Json
          id: number
          publicado_em: string
          publicado_por: string | null
        }
        Insert: {
          dados: Json
          id?: number
          publicado_em?: string
          publicado_por?: string | null
        }
        Update: {
          dados?: Json
          id?: number
          publicado_em?: string
          publicado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_publicado_publicado_por_fkey"
            columns: ["publicado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_rascunho_status: {
        Row: {
          alterado_em: string
          id: number
        }
        Insert: {
          alterado_em?: string
          id?: number
        }
        Update: {
          alterado_em?: string
          id?: number
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
          finalizado_auto: boolean
          finalizado_em: string | null
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
          finalizado_auto?: boolean
          finalizado_em?: string | null
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
          finalizado_auto?: boolean
          finalizado_em?: string | null
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
          atendimento_max_minutos: number
          id: number
          updated_at: string
        }
        Insert: {
          alerta_atraso_segundos?: number
          atendimento_max_minutos?: number
          id?: number
          updated_at?: string
        }
        Update: {
          alerta_atraso_segundos?: number
          atendimento_max_minutos?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      integracao_google_drive: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          id: boolean
          refresh_token: string | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          id?: boolean
          refresh_token?: string | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          id?: boolean
          refresh_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integracao_google_drive_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          antes: Json | null
          criado_em: string
          depois: Json | null
          id: string
          registro_id: string | null
          tabela: string | null
          tipo: Database["public"]["Enums"]["auditoria_tipo"]
          usuario_id: string | null
        }
        Insert: {
          antes?: Json | null
          criado_em?: string
          depois?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string | null
          tipo: Database["public"]["Enums"]["auditoria_tipo"]
          usuario_id?: string | null
        }
        Update: {
          antes?: Json | null
          criado_em?: string
          depois?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string | null
          tipo?: Database["public"]["Enums"]["auditoria_tipo"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          destaque: boolean
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
          destaque?: boolean
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
          destaque?: boolean
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
          eh_admin_innovation: boolean
          email: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          eh_admin_innovation?: boolean
          email?: string | null
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          eh_admin_innovation?: boolean
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
          favicon_path: string | null
          id: number
          logo_path: string | null
          updated_at: string
        }
        Insert: {
          favicon_path?: string | null
          id?: number
          logo_path?: string | null
          updated_at?: string
        }
        Update: {
          favicon_path?: string | null
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
      eh_admin_innovation: { Args: never; Returns: boolean }
      finalizar_chamado: {
        Args: { p_id: string }
        Returns: {
          motivo: string
          ok: boolean
        }[]
      }
      finalizar_chamados_expirados: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_garcom: { Args: never; Returns: boolean }
      mesa_por_token: {
        Args: { p_token: string }
        Returns: {
          id: string
          identificador: string
        }[]
      }
      registrar_auditoria_manual: {
        Args: {
          p_antes?: Json
          p_depois?: Json
          p_registro_id?: string
          p_tabela?: string
          p_tipo: Database["public"]["Enums"]["auditoria_tipo"]
        }
        Returns: undefined
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
      auditoria_tipo: "criacao" | "edicao" | "exclusao" | "entrada" | "saida"
      cardapio_arredondamento: "nenhum" | "pequeno" | "medio" | "grande"
      cardapio_descricao_caixa: "original" | "maiusculo" | "frase"
      cardapio_logo_posicao: "esquerda" | "centro" | "direita"
      cardapio_logo_tamanho: "pequeno" | "medio" | "grande"
      chamado_status: "pendente" | "aceito" | "cancelado" | "finalizado"
      mesa_area: "interna" | "externa"
      produto_imagem_layout: "miniatura" | "grande"
      produto_modelo: "simples" | "tamanhos" | "compartilhar"
      user_role: "admin" | "garcom" | "gerente"
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
      auditoria_tipo: ["criacao", "edicao", "exclusao", "entrada", "saida"],
      cardapio_arredondamento: ["nenhum", "pequeno", "medio", "grande"],
      cardapio_descricao_caixa: ["original", "maiusculo", "frase"],
      cardapio_logo_posicao: ["esquerda", "centro", "direita"],
      cardapio_logo_tamanho: ["pequeno", "medio", "grande"],
      chamado_status: ["pendente", "aceito", "cancelado", "finalizado"],
      mesa_area: ["interna", "externa"],
      produto_imagem_layout: ["miniatura", "grande"],
      produto_modelo: ["simples", "tamanhos", "compartilhar"],
      user_role: ["admin", "garcom", "gerente"],
    },
  },
} as const

