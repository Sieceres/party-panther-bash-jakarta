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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contact_logs: {
        Row: {
          contact_date: string
          contact_id: string
          contact_method: string
          contacted_by: string
          created_at: string
          id: string
          notes: string
          updated_at: string
        }
        Insert: {
          contact_date?: string
          contact_id: string
          contact_method: string
          contacted_by: string
          created_at?: string
          id?: string
          notes: string
          updated_at?: string
        }
        Update: {
          contact_date?: string
          contact_id?: string
          contact_method?: string
          contacted_by?: string
          created_at?: string
          id?: string
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          event_id: string
          id: string
          is_co_organizer: boolean
          joined_at: string | null
          note: string | null
          payment_date: string | null
          payment_marked_by: string | null
          payment_status: boolean
          receipt_uploaded_at: string | null
          receipt_url: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          is_co_organizer?: boolean
          joined_at?: string | null
          note?: string | null
          payment_date?: string | null
          payment_marked_by?: string | null
          payment_status?: boolean
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          is_co_organizer?: boolean
          joined_at?: string | null
          note?: string | null
          payment_date?: string | null
          payment_marked_by?: string | null
          payment_status?: boolean
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendees_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_attendees_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_check_ins: {
        Row: {
          checked_in_at: string
          checked_in_by: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          comment: string
          created_at: string
          event_id: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          event_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          event_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "event_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_event_comments_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_event_tags: {
        Row: {
          created_at: string
          event_id: string
          id: string
          tag_name: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          tag_name: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          event_id: string
          expires_at: string | null
          id: string
          invited_user_email: string | null
          is_revoked: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          event_id: string
          expires_at?: string | null
          id?: string
          invited_user_email?: string | null
          is_revoked?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          invited_user_email?: string | null
          is_revoked?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invite_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_photo_reports: {
        Row: {
          id: string
          photo_id: string
          reason: string
          reported_at: string
          reported_by: string
        }
        Insert: {
          id?: string
          photo_id: string
          reason: string
          reported_at?: string
          reported_by: string
        }
        Update: {
          id?: string
          photo_id?: string
          reason?: string
          reported_at?: string
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_photo_reports_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "event_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_photos: {
        Row: {
          event_id: string
          id: string
          is_hidden: boolean
          photo_url: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          event_id: string
          id?: string
          is_hidden?: boolean
          photo_url: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          event_id?: string
          id?: string
          is_hidden?: boolean
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tag_assignments: {
        Row: {
          event_id: string
          id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          id?: string
          tag_id: string
        }
        Update: {
          event_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tag_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "event_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          access_level: Database["public"]["Enums"]["event_access_level"]
          created_at: string
          created_by: string
          date: string
          description: string | null
          enable_check_in: boolean
          enable_photos: boolean
          id: string
          image_url: string | null
          instagram_post_url: string | null
          is_recurrent: boolean | null
          max_attendees: number | null
          organizer_name: string | null
          organizer_whatsapp: string | null
          price_currency: string | null
          slug: string | null
          time: string
          title: string
          track_payments: boolean
          updated_at: string
          venue_address: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["event_access_level"]
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          enable_check_in?: boolean
          enable_photos?: boolean
          id?: string
          image_url?: string | null
          instagram_post_url?: string | null
          is_recurrent?: boolean | null
          max_attendees?: number | null
          organizer_name?: string | null
          organizer_whatsapp?: string | null
          price_currency?: string | null
          slug?: string | null
          time: string
          title: string
          track_payments?: boolean
          updated_at?: string
          venue_address?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["event_access_level"]
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          enable_check_in?: boolean
          enable_photos?: boolean
          id?: string
          image_url?: string | null
          instagram_post_url?: string | null
          is_recurrent?: boolean | null
          max_attendees?: number | null
          organizer_name?: string | null
          organizer_whatsapp?: string | null
          price_currency?: string | null
          slug?: string | null
          time?: string
          title?: string
          track_payments?: boolean
          updated_at?: string
          venue_address?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          party_style: string | null
          profile_type: string | null
          updated_at: string
          user_id: string
          venue_address: string | null
          venue_applied_at: string | null
          venue_opening_hours: string | null
          venue_status: string | null
          venue_verified_at: string | null
          venue_verified_by: string | null
          venue_whatsapp: string | null
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          party_style?: string | null
          profile_type?: string | null
          updated_at?: string
          user_id: string
          venue_address?: string | null
          venue_applied_at?: string | null
          venue_opening_hours?: string | null
          venue_status?: string | null
          venue_verified_at?: string | null
          venue_verified_by?: string | null
          venue_whatsapp?: string | null
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          party_style?: string | null
          profile_type?: string | null
          updated_at?: string
          user_id?: string
          venue_address?: string | null
          venue_applied_at?: string | null
          venue_opening_hours?: string | null
          venue_status?: string | null
          venue_verified_at?: string | null
          venue_verified_by?: string | null
          venue_whatsapp?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      promo_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          parent_id: string | null
          promo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          parent_id?: string | null
          promo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          promo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_promo_comments_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "promo_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "promo_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_comments_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promos"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          promo_id: string
          promo_id_uuid: string | null
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          promo_id: string
          promo_id_uuid?: string | null
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          promo_id?: string
          promo_id_uuid?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_reviews_backup: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          promo_id: string | null
          rating: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          promo_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          promo_id?: string | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      promos: {
        Row: {
          area: string | null
          category: string | null
          created_at: string
          created_by: string
          day_of_week: string[] | null
          description: string
          discount_text: string
          discounted_price_amount: number | null
          drink_type: string[] | null
          id: string
          image_url: string | null
          original_price_amount: number | null
          price_currency: string | null
          promo_type: string | null
          slug: string | null
          title: string
          updated_at: string
          valid_until: string | null
          venue_address: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_name: string
        }
        Insert: {
          area?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          day_of_week?: string[] | null
          description: string
          discount_text: string
          discounted_price_amount?: number | null
          drink_type?: string[] | null
          id?: string
          image_url?: string | null
          original_price_amount?: number | null
          price_currency?: string | null
          promo_type?: string | null
          slug?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
          venue_address?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name: string
        }
        Update: {
          area?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          day_of_week?: string[] | null
          description?: string
          discount_text?: string
          discounted_price_amount?: number | null
          drink_type?: string[] | null
          id?: string
          image_url?: string | null
          original_price_amount?: number | null
          price_currency?: string | null
          promo_type?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
          venue_address?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_name?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_title: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_title?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_title?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_favorite_promos: {
        Row: {
          created_at: string
          id: string
          promo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_promos_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_attendee_stats: {
        Row: {
          attendee_count: number | null
          event_id: string | null
          last_join_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_review_stats: {
        Row: {
          avg_rating: number | null
          promo_id: string | null
          total_reviews: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_event_attendees: {
        Args: { event_id_param: string }
        Returns: boolean
      }
      can_user_update_event: {
        Args: { event_id_param: string }
        Returns: boolean
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_event_attendee_counts: {
        Args: never
        Returns: {
          attendee_count: number
          event_id: string
        }[]
      }
      get_event_co_organizers: {
        Args: { event_id_param: string }
        Returns: {
          avatar_url: string
          display_name: string
          is_verified: boolean
          joined_at: string
          user_id: string
        }[]
      }
      get_event_tags_by_category: {
        Args: never
        Returns: {
          category: string
          id: string
          name: string
          sort_order: number
        }[]
      }
      get_events_safe: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          image_url: string
          is_recurrent: boolean
          organizer_name: string
          organizer_whatsapp: string
          price_currency: string
          slug: string
          time: string
          title: string
          updated_at: string
          venue_address: string
          venue_latitude: number
          venue_longitude: number
          venue_name: string
        }[]
      }
      get_events_simple: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          image_url: string
          is_recurrent: boolean
          organizer_name: string
          organizer_whatsapp: string
          price_currency: string
          slug: string
          time: string
          title: string
          updated_at: string
          venue_address: string
          venue_latitude: number
          venue_longitude: number
          venue_name: string
        }[]
      }
      get_events_with_details: {
        Args: {
          p_after_date?: string
          p_after_time?: string
          p_limit?: number
          user_id_param?: string
        }
        Returns: {
          attendee_count: number
          created_at: string
          created_by: string
          creator_avatar: string
          creator_name: string
          creator_verified: boolean
          date: string
          description: string
          id: string
          image_url: string
          is_joined: boolean
          is_recurrent: boolean
          organizer_name: string
          organizer_whatsapp: string
          price_currency: string
          slug: string
          time: string
          title: string
          updated_at: string
          venue_address: string
          venue_latitude: number
          venue_longitude: number
          venue_name: string
        }[]
      }
      get_full_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          business_name: string
          created_at: string
          display_name: string
          gender: string
          id: string
          instagram: string
          is_verified: boolean
          party_style: string
          profile_type: string
          updated_at: string
          user_id: string
          whatsapp: string
        }[]
      }
      get_my_claim: { Args: { claim: string }; Returns: Json }
      get_promos_simple: {
        Args: never
        Returns: {
          area: string
          category: string
          created_at: string
          created_by: string
          day_of_week: string[]
          description: string
          discount_text: string
          discounted_price_amount: number
          drink_type: string[]
          id: string
          image_url: string
          original_price_amount: number
          price_currency: string
          promo_type: string
          slug: string
          title: string
          updated_at: string
          valid_until: string
          venue_address: string
          venue_latitude: number
          venue_longitude: number
          venue_name: string
        }[]
      }
      get_promos_with_details:
        | {
            Args: { p_slug: string }
            Returns: {
              created_at: string
              created_by: string
              description: string
              discounted_price_amount: number
              id: string
              image_url: string
              original_price_amount: number
              price_currency: string
              promo_type: string
              review_avg: number
              review_count: number
              slug: string
              title: string
              updated_at: string
            }[]
          }
        | {
            Args: { user_id_param?: string }
            Returns: {
              area: string
              average_rating: number
              category: string
              created_at: string
              created_by: string
              creator_avatar: string
              creator_name: string
              creator_verified: boolean
              day_of_week: string[]
              description: string
              discount_text: string
              discounted_price_amount: number
              drink_type: string[]
              id: string
              image_url: string
              is_favorite: boolean
              original_price_amount: number
              price_currency: string
              promo_type: string
              slug: string
              title: string
              total_reviews: number
              updated_at: string
              valid_until: string
              venue_address: string
              venue_latitude: number
              venue_longitude: number
              venue_name: string
            }[]
          }
        | {
            Args: {
              p_after_created_at?: string
              p_limit?: number
              user_id_param?: string
            }
            Returns: {
              area: string
              average_rating: number
              category: string
              created_at: string
              created_by: string
              creator_avatar: string
              creator_name: string
              creator_verified: boolean
              day_of_week: string[]
              description: string
              discount_text: string
              discounted_price_amount: number
              drink_type: string[]
              id: string
              image_url: string
              is_favorite: boolean
              original_price_amount: number
              price_currency: string
              promo_type: string
              slug: string
              title: string
              total_reviews: number
              updated_at: string
              valid_until: string
              venue_address: string
              venue_latitude: number
              venue_longitude: number
              venue_name: string
            }[]
          }
      get_public_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          business_name: string
          display_name: string
          gender: string
          id: string
          instagram: string
          is_verified: boolean
          profile_type: string
          whatsapp: string
        }[]
      }
      get_safe_profile_info: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          business_name: string
          display_name: string
          id: string
          is_verified: boolean
          profile_type: string
          user_id: string
        }[]
      }
      get_unique_event_slug: {
        Args: { event_id?: string; title_text: string }
        Returns: string
      }
      get_unique_promo_slug: {
        Args: { promo_id?: string; title_text: string }
        Returns: string
      }
      get_user_admin_status: {
        Args: { user_id_param: string }
        Returns: {
          is_admin: boolean
          is_super_admin: boolean
        }[]
      }
      get_user_role:
        | { Args: never; Returns: string }
        | { Args: { _user_id: string }; Returns: string }
      has_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_superadmin_role: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_event_co_organizer: {
        Args: { event_id_param: string; user_id_param: string }
        Returns: boolean
      }
      refresh_event_attendee_stats: { Args: never; Returns: undefined }
      refresh_promo_review_stats: { Args: never; Returns: undefined }
      should_show_organizer_contact: { Args: never; Returns: boolean }
    }
    Enums: {
      event_access_level: "public" | "private" | "invite_only" | "secret"
      user_role: "user" | "admin" | "superadmin"
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
      event_access_level: ["public", "private", "invite_only", "secret"],
      user_role: ["user", "admin", "superadmin"],
    },
  },
} as const
