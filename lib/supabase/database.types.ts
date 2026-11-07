export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          event_id: string;
          id: string;
          pinned: boolean;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          event_id: string;
          id?: string;
          pinned?: boolean;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          pinned?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      carpool_passengers: {
        Row: {
          created_at: string;
          event_id: string;
          ride_id: string;
          status: Database["public"]["Enums"]["passenger_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          ride_id: string;
          status?: Database["public"]["Enums"]["passenger_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          ride_id?: string;
          status?: Database["public"]["Enums"]["passenger_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carpool_passengers_ride_event_fkey";
            columns: ["ride_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "carpool_rides";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "carpool_passengers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      carpool_rides: {
        Row: {
          created_at: string;
          depart_at: string;
          driver_id: string;
          event_id: string;
          id: string;
          origin: string;
          seats: number;
        };
        Insert: {
          created_at?: string;
          depart_at: string;
          driver_id: string;
          event_id: string;
          id?: string;
          origin: string;
          seats: number;
        };
        Update: {
          created_at?: string;
          depart_at?: string;
          driver_id?: string;
          event_id?: string;
          id?: string;
          origin?: string;
          seats?: number;
        };
        Relationships: [
          {
            foreignKeyName: "carpool_rides_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carpool_rides_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_series: {
        Row: {
          created_at: string;
          end_date: string;
          host_id: string;
          id: string;
          updated_at: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          host_id: string;
          id?: string;
          updated_at?: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          host_id?: string;
          id?: string;
          updated_at?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "event_series_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          capacity: number;
          created_at: string;
          description: string | null;
          host_id: string;
          id: string;
          location: string;
          rsvp_deadline: string | null;
          series_id: string | null;
          share_code: string;
          starts_at: string;
          title: string;
          transfer_account: string | null;
          updated_at: string;
        };
        Insert: {
          capacity: number;
          created_at?: string;
          description?: string | null;
          host_id: string;
          id?: string;
          location: string;
          rsvp_deadline?: string | null;
          series_id?: string | null;
          share_code?: string;
          starts_at: string;
          title: string;
          transfer_account?: string | null;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          description?: string | null;
          host_id?: string;
          id?: string;
          location?: string;
          rsvp_deadline?: string | null;
          series_id?: string | null;
          share_code?: string;
          starts_at?: string;
          title?: string;
          transfer_account?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "event_series";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          payer_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          payer_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          payer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_payer_id_fkey";
            columns: ["payer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      participations: {
        Row: {
          attended: boolean;
          created_at: string;
          event_id: string;
          status: Database["public"]["Enums"]["participation_status"];
          user_id: string;
        };
        Insert: {
          attended?: boolean;
          created_at?: string;
          event_id: string;
          status: Database["public"]["Enums"]["participation_status"];
          user_id: string;
        };
        Update: {
          attended?: boolean;
          created_at?: string;
          event_id?: string;
          status?: Database["public"]["Enums"]["participation_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      settlement_shares: {
        Row: {
          amount: number;
          confirmed_at: string | null;
          event_id: string;
          marked_at: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          user_id: string;
        };
        Insert: {
          amount: number;
          confirmed_at?: string | null;
          event_id: string;
          marked_at?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          user_id: string;
        };
        Update: {
          amount?: number;
          confirmed_at?: string | null;
          event_id?: string;
          marked_at?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlement_shares_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_shares_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_event_invite: {
        Args: { p_code: string };
        Returns: {
          capacity: number;
          description: string;
          going_count: number;
          host_name: string;
          location: string;
          rsvp_deadline: string;
          starts_at: string;
          title: string;
        }[];
      };
    };
    Enums: {
      participation_status: "going" | "not_going" | "waitlist";
      passenger_status: "pending" | "accepted" | "rejected";
      payment_status: "unpaid" | "marked" | "confirmed";
      user_role: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      participation_status: ["going", "not_going", "waitlist"],
      passenger_status: ["pending", "accepted", "rejected"],
      payment_status: ["unpaid", "marked", "confirmed"],
      user_role: ["user", "admin"],
    },
  },
} as const;
