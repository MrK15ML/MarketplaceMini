export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          location_city: string | null;
          location_lat: number | null;
          location_lng: number | null;
          is_seller: boolean;
          is_verified: boolean;
          avg_rating: number;
          avg_communication: number;
          avg_quality: number;
          avg_reliability: number;
          total_reviews: number;
          handshake_score: number;
          total_completed_deals: number;
          avg_response_hours: number | null;
          completion_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          location_city?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          is_seller?: boolean;
          is_verified?: boolean;
          avg_rating?: number;
          avg_communication?: number;
          avg_quality?: number;
          avg_reliability?: number;
          total_reviews?: number;
          handshake_score?: number;
          total_completed_deals?: number;
          avg_response_hours?: number | null;
          completion_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location_city?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          is_seller?: boolean;
          is_verified?: boolean;
          avg_rating?: number;
          avg_communication?: number;
          avg_quality?: number;
          avg_reliability?: number;
          total_reviews?: number;
          handshake_score?: number;
          total_completed_deals?: number;
          avg_response_hours?: number | null;
          completion_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          category: string;
          subcategory: string | null;
          pricing_type: string;
          price_min: number | null;
          price_max: number | null;
          price_fixed: number | null;
          currency: string;
          is_remote: boolean;
          location_radius_km: number | null;
          availability: unknown | null;
          requires_license: boolean;
          license_type: string | null;
          is_active: boolean;
          cover_image_url: string | null;
          images: string[] | null;
          tags: string[];
          view_count: number;
          request_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description: string;
          category: string;
          subcategory?: string | null;
          pricing_type: string;
          price_min?: number | null;
          price_max?: number | null;
          price_fixed?: number | null;
          currency?: string;
          is_remote?: boolean;
          location_radius_km?: number | null;
          availability?: unknown | null;
          requires_license?: boolean;
          license_type?: string | null;
          is_active?: boolean;
          cover_image_url?: string | null;
          images?: string[] | null;
          tags?: string[];
          view_count?: number;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string;
          category?: string;
          subcategory?: string | null;
          pricing_type?: string;
          price_min?: number | null;
          price_max?: number | null;
          price_fixed?: number | null;
          currency?: string;
          is_remote?: boolean;
          location_radius_km?: number | null;
          availability?: unknown | null;
          requires_license?: boolean;
          license_type?: string | null;
          is_active?: boolean;
          cover_image_url?: string | null;
          images?: string[] | null;
          tags?: string[];
          view_count?: number;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      qualifications: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string | null;
          type: string;
          title: string;
          description: string | null;
          document_url: string | null;
          verified: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id?: string | null;
          type: string;
          title: string;
          description?: string | null;
          document_url?: string | null;
          verified?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string | null;
          type?: string;
          title?: string;
          description?: string | null;
          document_url?: string | null;
          verified?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qualifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qualifications_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      job_requests: {
        Row: {
          id: string;
          listing_id: string;
          customer_id: string;
          seller_id: string;
          status: string;
          description: string;
          budget_min: number | null;
          budget_max: number | null;
          preferred_time: string | null;
          location: string | null;
          attachments: unknown | null;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          customer_id: string;
          seller_id: string;
          status?: string;
          description: string;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_time?: string | null;
          location?: string | null;
          attachments?: unknown | null;
          category: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          customer_id?: string;
          seller_id?: string;
          status?: string;
          description?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_time?: string | null;
          location?: string | null;
          attachments?: unknown | null;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_requests_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_requests_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_requests_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          id: string;
          job_request_id: string;
          version: number;
          seller_id: string;
          price: number;
          pricing_type: string;
          estimated_duration: string | null;
          scope_description: string;
          valid_until: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_request_id: string;
          version?: number;
          seller_id: string;
          price: number;
          pricing_type: string;
          estimated_duration?: string | null;
          scope_description: string;
          valid_until?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_request_id?: string;
          version?: number;
          seller_id?: string;
          price?: number;
          pricing_type?: string;
          estimated_duration?: string | null;
          scope_description?: string;
          valid_until?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_job_request_id_fkey";
            columns: ["job_request_id"];
            isOneToOne: false;
            referencedRelation: "job_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          id: string;
          job_request_id: string;
          offer_id: string;
          customer_id: string;
          seller_id: string;
          status: string;
          agreed_price: number;
          agreed_scope: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_request_id: string;
          offer_id: string;
          customer_id: string;
          seller_id: string;
          status?: string;
          agreed_price: number;
          agreed_scope: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_request_id?: string;
          offer_id?: string;
          customer_id?: string;
          seller_id?: string;
          status?: string;
          agreed_price?: number;
          agreed_scope?: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_job_request_id_fkey";
            columns: ["job_request_id"];
            isOneToOne: false;
            referencedRelation: "job_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          job_request_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          metadata: unknown | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_request_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          metadata?: unknown | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_request_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string;
          metadata?: unknown | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_job_request_id_fkey";
            columns: ["job_request_id"];
            isOneToOne: false;
            referencedRelation: "job_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          deal_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          rating_communication: number | null;
          rating_quality: number | null;
          rating_reliability: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          rating_communication?: number | null;
          rating_quality?: number | null;
          rating_reliability?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          rating_communication?: number | null;
          rating_quality?: number | null;
          rating_reliability?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey";
            columns: ["reviewee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_listing_id: string | null;
          reason: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_listing_id?: string | null;
          reason: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string | null;
          reported_listing_id?: string | null;
          reason?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey";
            columns: ["reported_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_listing_id_fkey";
            columns: ["reported_listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      verifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          status: string;
          provider: string | null;
          metadata: unknown | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          status?: string;
          provider?: string | null;
          metadata?: unknown | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          status?: string;
          provider?: string | null;
          metadata?: unknown | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string | null;
          metadata: unknown | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          description?: string | null;
          metadata?: unknown | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          description?: string | null;
          metadata?: unknown | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_feed_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_offer: {
        Args: { p_offer_id: string; p_customer_id: string };
        Returns: string;
      };
      update_profile_rating: {
        Args: { p_reviewee_id: string };
        Returns: undefined;
      };
      recalculate_handshake_score: {
        Args: { p_seller_id: string };
        Returns: undefined;
      };
      recalculate_all_seller_scores: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ============================================
// Convenience type aliases
// ============================================
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];

export type Qualification = Database["public"]["Tables"]["qualifications"]["Row"];
export type QualificationInsert = Database["public"]["Tables"]["qualifications"]["Insert"];
export type QualificationUpdate = Database["public"]["Tables"]["qualifications"]["Update"];

export type JobRequest = Database["public"]["Tables"]["job_requests"]["Row"];
export type JobRequestInsert = Database["public"]["Tables"]["job_requests"]["Insert"];
export type JobRequestUpdate = Database["public"]["Tables"]["job_requests"]["Update"];

export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"];
export type OfferUpdate = Database["public"]["Tables"]["offers"]["Update"];

export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
export type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
export type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];

export type Verification = Database["public"]["Tables"]["verifications"]["Row"];
export type VerificationInsert = Database["public"]["Tables"]["verifications"]["Insert"];
export type VerificationUpdate = Database["public"]["Tables"]["verifications"]["Update"];

export type ActivityFeedItem = Database["public"]["Tables"]["activity_feed"]["Row"];
export type ActivityFeedInsert = Database["public"]["Tables"]["activity_feed"]["Insert"];

// ============================================
// Domain-specific types
// ============================================
export type Category =
  | "odd_jobs" | "trades" | "remote" | "tutoring" | "consultation"
  | "creative" | "tech" | "pet_services" | "health_wellness" | "events" | "automotive" | "home_property";
export type PricingType = "fixed" | "range" | "hourly";
export type QualificationType = "license" | "certificate" | "portfolio" | "testimonial";
export type JobRequestStatus = "pending" | "clarifying" | "offered" | "accepted" | "in_progress" | "completed" | "reviewed" | "cancelled" | "declined";
export type OfferStatus = "pending" | "accepted" | "declined" | "expired" | "superseded";
export type DealStatus = "active" | "completed" | "disputed" | "cancelled";
export type MessageType = "text" | "offer_notification" | "status_change" | "system";
export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type VerificationType = "identity" | "email" | "phone" | "license";

export type AvailabilityWindow = {
  day: string;
  start: string;
  end: string;
};

// ============================================
// Composite types for joins
// ============================================
export type ListingWithSeller = Listing & {
  profiles: Profile;
};

export type JobRequestWithParticipants = JobRequest & {
  customer: Profile;
  seller: Profile;
  listing: Listing;
};

export type ReviewWithReviewer = Review & {
  reviewer: Profile;
};

export type MessageWithSender = Message & {
  sender: Profile;
};

export type OfferWithSeller = Offer & {
  seller: Profile;
};

export type DealWithParticipants = Deal & {
  customer: Profile;
  seller: Profile;
  offer: Offer;
};

// ============================================
// Scoring & ranking types
// ============================================
export type TrustTier = "new" | "rising" | "trusted" | "top_provider";

export type ListingSortOption =
  | "best_match"
  | "top_rated"
  | "most_reviews"
  | "newest"
  | "price_low"
  | "price_high";

export type SellerStats = {
  handshake_score: number;
  trust_tier: TrustTier;
  avg_rating: number;
  total_reviews: number;
  total_completed_deals: number;
  avg_response_hours: number | null;
  completion_rate: number | null;
};

export type PlatformAverages = {
  avg_score: number;
  avg_rating: number;
  avg_completion_rate: number;
  avg_response_hours: number;
  avg_completed_deals: number;
  total_sellers: number;
};
