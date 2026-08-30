export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      giveaways: {
        Row: {
          created_at: string
          description: string
          end_date: string
          id: string
          image_url: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
          winner_limit: number
        }
        Insert: {
          created_at?: string
          description?: string
          end_date: string
          id?: string
          image_url?: string | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
          winner_limit?: number
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          image_url?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          winner_limit?: number
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          giveaway_id: string
          id: string
          instagram_link: string
          instagram_username: string
          instagram_username_normalized: string
          ip_hash: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          giveaway_id: string
          id?: string
          instagram_link: string
          instagram_username: string
          instagram_username_normalized: string
          ip_hash?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          giveaway_id?: string
          id?: string
          instagram_link?: string
          instagram_username?: string
          instagram_username_normalized?: string
          ip_hash?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      winners: {
        Row: {
          full_name: string
          giveaway_id: string
          id: string
          instagram_link: string
          instagram_username: string
          rank: number
          selected_at: string
        }
        Insert: {
          full_name: string
          giveaway_id: string
          id?: string
          instagram_link: string
          instagram_username: string
          rank: number
          selected_at?: string
        }
        Update: {
          full_name?: string
          giveaway_id?: string
          id?: string
          instagram_link?: string
          instagram_username?: string
          rank?: number
          selected_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      giveaways_public: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string | null
          image_url: string | null
          participant_count: number | null
          start_date: string | null
          status: string | null
          title: string | null
          winner_limit: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          image_url?: string | null
          participant_count?: never
          start_date?: string | null
          status?: string | null
          title?: string | null
          winner_limit?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          image_url?: string | null
          participant_count?: never
          start_date?: string | null
          status?: string | null
          title?: string | null
          winner_limit?: number | null
        }
        Relationships: []
      }
      winners_public: {
        Row: {
          full_name: string | null
          giveaway_id: string | null
          instagram_link: string | null
          instagram_username: string | null
          rank: number | null
          selected_at: string | null
        }
        Insert: {
          full_name?: string | null
          giveaway_id?: string | null
          instagram_link?: string | null
          instagram_username?: string | null
          rank?: number | null
          selected_at?: string | null
        }
        Update: {
          full_name?: string | null
          giveaway_id?: string | null
          instagram_link?: string | null
          instagram_username?: string | null
          rank?: number | null
          selected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_participant_count: {
        Args: { p_giveaway_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pick_giveaway_winners: {
        Args: { p_giveaway_id: string }
        Returns: {
          full_name: string
          giveaway_id: string
          id: string
          instagram_link: string
          instagram_username: string
          rank: number
          selected_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "winners"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      submit_participant: {
        Args: {
          p_email?: string
          p_full_name: string
          p_giveaway_id: string
          p_honeypot?: string
          p_instagram_link: string
          p_instagram_username: string
          p_instagram_username_normalized: string
          p_ip_hash?: string
          p_phone?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
