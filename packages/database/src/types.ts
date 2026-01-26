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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_user_id_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          created_at: string
          floor_name: string
          floor_order: number
          id: string
          is_active: boolean | null
          layout_config: Json | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          floor_name: string
          floor_order?: number
          id?: string
          is_active?: boolean | null
          layout_config?: Json | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          floor_name?: string
          floor_order?: number
          id?: string
          is_active?: boolean | null
          layout_config?: Json | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "floors_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_blacklisted: boolean | null
          is_vip: boolean | null
          last_visit_date: string | null
          notes: string | null
          phone_number: string
          preferences: Json | null
          total_cancellations: number | null
          total_no_shows: number | null
          total_reservations: number | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_blacklisted?: boolean | null
          is_vip?: boolean | null
          last_visit_date?: string | null
          notes?: string | null
          phone_number: string
          preferences?: Json | null
          total_cancellations?: number | null
          total_no_shows?: number | null
          total_reservations?: number | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_blacklisted?: boolean | null
          is_vip?: boolean | null
          last_visit_date?: string | null
          notes?: string | null
          phone_number?: string
          preferences?: Json | null
          total_cancellations?: number | null
          total_no_shows?: number | null
          total_reservations?: number | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          created_at: string
          fallback_phone_number: string | null
          id: string
          is_primary: boolean | null
          monthly_cost: number | null
          phone_country: string
          phone_number: string
          phone_provider: string
          phone_provider_sid: string
          phone_status: string
          purchased_at: string
          updated_at: string
          vapi_assistant_id: string
          vapi_phone_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          fallback_phone_number?: string | null
          id?: string
          is_primary?: boolean | null
          monthly_cost?: number | null
          phone_country: string
          phone_number: string
          phone_provider?: string
          phone_provider_sid: string
          phone_status?: string
          purchased_at?: string
          updated_at?: string
          vapi_assistant_id: string
          vapi_phone_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          fallback_phone_number?: string | null
          id?: string
          is_primary?: boolean | null
          monthly_cost?: number | null
          phone_country?: string
          phone_number?: string
          phone_provider?: string
          phone_provider_sid?: string
          phone_status?: string
          purchased_at?: string
          updated_at?: string
          vapi_assistant_id?: string
          vapi_phone_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          floor_id: string | null
          guest_id: string
          guest_name: string
          guest_phone: string
          id: string
          internal_notes: string | null
          party_size: number
          reservation_date: string
          reservation_datetime: string
          reservation_time: string
          seated_at: string | null
          special_requests: string | null
          status: string
          table_id: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          floor_id?: string | null
          guest_id: string
          guest_name: string
          guest_phone: string
          id?: string
          internal_notes?: string | null
          party_size: number
          reservation_date: string
          reservation_datetime: string
          reservation_time: string
          seated_at?: string | null
          special_requests?: string | null
          status?: string
          table_id?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          floor_id?: string | null
          guest_id?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          internal_notes?: string | null
          party_size?: number
          reservation_date?: string
          reservation_datetime?: string
          reservation_time?: string
          seated_at?: string | null
          special_requests?: string | null
          status?: string
          table_id?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "table_status_view"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt?: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_user_id_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string
          floor_id: string
          height: number
          id: string
          is_active: boolean | null
          max_capacity: number
          min_capacity: number
          notes: string | null
          position_x: number
          position_y: number
          rotation: number | null
          shape: string
          style_config: Json | null
          table_identifier: string
          table_number: number | null
          updated_at: string
          venue_id: string
          width: number
        }
        Insert: {
          created_at?: string
          floor_id: string
          height?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          min_capacity?: number
          notes?: string | null
          position_x: number
          position_y: number
          rotation?: number | null
          shape?: string
          style_config?: Json | null
          table_identifier: string
          table_number?: number | null
          updated_at?: string
          venue_id: string
          width?: number
        }
        Update: {
          created_at?: string
          floor_id?: string
          height?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number
          min_capacity?: number
          notes?: string | null
          position_x?: number
          position_y?: number
          rotation?: number | null
          shape?: string
          style_config?: Json | null
          table_identifier?: string
          table_number?: number | null
          updated_at?: string
          venue_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "tables_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string
          email: string
          emailVerified: boolean
          id: string
          name: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          emailVerified?: boolean
          id: string
          name?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          emailVerified?: boolean
          id?: string
          name?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      venue: {
        Row: {
          address: string | null
          ai_config: Json | null
          ai_status: string | null
          city: string | null
          country: string | null
          createdAt: string
          fallbackPhone: string | null
          id: string
          managerEmail: string | null
          managerName: string | null
          managerPhone: string | null
          minHeadsUp: number | null
          onboardingStatus: string
          onboardingStep: number
          schedule: Json | null
          updatedAt: string
          userId: string
          vapi_agent_id: string | null
          venueName: string | null
        }
        Insert: {
          address?: string | null
          ai_config?: Json | null
          ai_status?: string | null
          city?: string | null
          country?: string | null
          createdAt?: string
          fallbackPhone?: string | null
          id?: string
          managerEmail?: string | null
          managerName?: string | null
          managerPhone?: string | null
          minHeadsUp?: number | null
          onboardingStatus?: string
          onboardingStep?: number
          schedule?: Json | null
          updatedAt?: string
          userId: string
          vapi_agent_id?: string | null
          venueName?: string | null
        }
        Update: {
          address?: string | null
          ai_config?: Json | null
          ai_status?: string | null
          city?: string | null
          country?: string | null
          createdAt?: string
          fallbackPhone?: string | null
          id?: string
          managerEmail?: string | null
          managerName?: string | null
          managerPhone?: string | null
          minHeadsUp?: number | null
          onboardingStatus?: string
          onboardingStep?: number
          schedule?: Json | null
          updatedAt?: string
          userId?: string
          vapi_agent_id?: string | null
          venueName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      verification: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string | null
          value: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string | null
          value: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      table_status_view: {
        Row: {
          current_reservation_id: string | null
          duration_minutes: number | null
          floor_id: string | null
          guest_name: string | null
          guest_phone: string | null
          height: number | null
          max_capacity: number | null
          party_size: number | null
          position_x: number | null
          position_y: number | null
          reservation_datetime: string | null
          shape: string | null
          special_requests: string | null
          status: string | null
          status_color: string | null
          table_id: string | null
          table_identifier: string | null
          venue_id: string | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
