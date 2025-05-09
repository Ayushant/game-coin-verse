export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          coins_earned: number
          game_name: string
          id: string
          played_at: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          coins_earned?: number
          game_name: string
          id?: string
          played_at?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          coins_earned?: number
          game_name?: string
          id?: string
          played_at?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      manual_payments: {
        Row: {
          app_id: string
          id: string
          payment_method: string
          payment_proof_url: string | null
          status: string
          submitted_at: string
          user_id: string
          user_note: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          app_id: string
          id?: string
          payment_method: string
          payment_proof_url?: string | null
          status?: string
          submitted_at?: string
          user_id: string
          user_note?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          app_id?: string
          id?: string
          payment_method?: string
          payment_proof_url?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
          user_note?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_payments_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "paid_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          coins_reward: number
          description: string
          id: string
          is_active: boolean | null
          is_daily: boolean | null
          title: string
        }
        Insert: {
          coins_reward: number
          description: string
          id?: string
          is_active?: boolean | null
          is_daily?: boolean | null
          title: string
        }
        Update: {
          coins_reward?: number
          description?: string
          id?: string
          is_active?: boolean | null
          is_daily?: boolean | null
          title?: string
        }
        Relationships: []
      }
      paid_apps: {
        Row: {
          coin_price: number | null
          created_at: string
          description: string
          download_url: string
          id: string
          image_url: string | null
          inr_price: number | null
          name: string
          payment_instructions: string | null
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          coin_price?: number | null
          created_at?: string
          description: string
          download_url: string
          id?: string
          image_url?: string | null
          inr_price?: number | null
          name: string
          payment_instructions?: string | null
          payment_method?: string
          updated_at?: string | null
        }
        Update: {
          coin_price?: number | null
          created_at?: string
          description?: string
          download_url?: string
          id?: string
          image_url?: string | null
          inr_price?: number | null
          name?: string
          payment_instructions?: string | null
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number | null
          created_at: string | null
          id: string
          is_guest: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          coins?: number | null
          created_at?: string | null
          id: string
          is_guest?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          coins?: number | null
          created_at?: string | null
          id?: string
          is_guest?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          app_id: string
          created_at: string
          id: string
          payment_type: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          payment_type: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          payment_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "paid_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          action: string
          coins: number
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          coins: number
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          coins?: number
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          coins_to_inr: number
          created_at: string
          id: string
          min_withdrawal_coins: number | null
          updated_at: string
        }
        Insert: {
          coins_to_inr: number
          created_at?: string
          id?: string
          min_withdrawal_coins?: number | null
          updated_at?: string
        }
        Update: {
          coins_to_inr?: number
          created_at?: string
          id?: string
          min_withdrawal_coins?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          coins_spent: number
          id: string
          method: string
          payment_detail: string
          processed_at: string | null
          requested_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          coins_spent: number
          id?: string
          method: string
          payment_detail: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          coins_spent?: number
          id?: string
          method?: string
          payment_detail?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_confirm_admin: {
        Args: { admin_email: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_method: "coins" | "razorpay" | "manual" | "free"
      payment_status: "pending" | "approved" | "rejected"
      user_role: "user" | "admin"
      withdrawal_status: "pending" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ["coins", "razorpay", "manual", "free"],
      payment_status: ["pending", "approved", "rejected"],
      user_role: ["user", "admin"],
      withdrawal_status: ["pending", "completed", "failed"],
    },
  },
} as const
