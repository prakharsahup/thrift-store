export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          country: string;
          created_at: string;
          id: string;
          is_default: boolean;
          line1: string;
          line2: string | null;
          name: string;
          phone: string;
          pincode: string;
          state: string;
          user_id: string;
        };
        Insert: {
          city: string;
          country?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          line1: string;
          line2?: string | null;
          name: string;
          phone: string;
          pincode: string;
          state: string;
          user_id?: string;
        };
        Update: {
          city?: string;
          country?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          line1?: string;
          line2?: string | null;
          name?: string;
          phone?: string;
          pincode?: string;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      auth_account_status_checks: {
        Row: {
          client_key: string;
          created_at: string;
        };
        Insert: {
          client_key: string;
          created_at?: string;
        };
        Update: {
          client_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          created_at: string;
          cta_label: string;
          ends_at: string | null;
          id: string;
          image_alt: string;
          image_url: string;
          is_active: boolean;
          link_url: string;
          sort_order: number;
          starts_at: string | null;
          subtitle: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          cta_label?: string;
          ends_at?: string | null;
          id?: string;
          image_alt?: string;
          image_url: string;
          is_active?: boolean;
          link_url: string;
          sort_order?: number;
          starts_at?: string | null;
          subtitle?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          cta_label?: string;
          ends_at?: string | null;
          id?: string;
          image_alt?: string;
          image_url?: string;
          is_active?: boolean;
          link_url?: string;
          sort_order?: number;
          starts_at?: string | null;
          subtitle?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          added_at: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          product_id: string;
          user_id?: string;
        };
        Update: {
          added_at?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "listed_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "storefront_products";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          gender: Database["public"]["Enums"]["gender"];
          id: string;
          image_url: string | null;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          gender: Database["public"]["Enums"]["gender"];
          id?: string;
          image_url?: string | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          gender?: Database["public"]["Enums"]["gender"];
          id?: string;
          image_url?: string | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      coupon_redemptions: {
        Row: {
          code: string;
          created_at: string;
          order_id: string;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          order_id: string;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          order_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_code_fkey";
            columns: ["code"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          expires_at: string | null;
          max_uses: number | null;
          min_order_paise: number;
          type: Database["public"]["Enums"]["coupon_type"];
          used_count: number;
          value: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          min_order_paise?: number;
          type: Database["public"]["Enums"]["coupon_type"];
          used_count?: number;
          value: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          min_order_paise?: number;
          type?: Database["public"]["Enums"]["coupon_type"];
          used_count?: number;
          value?: number;
        };
        Relationships: [];
      };
      drops: {
        Row: {
          banner_url: string | null;
          created_at: string;
          description: string;
          go_live_at: string;
          id: string;
          is_published: boolean;
          name: string;
          slug: string;
        };
        Insert: {
          banner_url?: string | null;
          created_at?: string;
          description?: string;
          go_live_at: string;
          id?: string;
          is_published?: boolean;
          name: string;
          slug: string;
        };
        Update: {
          banner_url?: string | null;
          created_at?: string;
          description?: string;
          go_live_at?: string;
          id?: string;
          is_published?: boolean;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      notify_requests: {
        Row: {
          client_key: string | null;
          confirm_token: string;
          confirmation_sent_at: string | null;
          confirmed_at: string | null;
          created_at: string;
          drop_id: string | null;
          email: string;
          id: string;
          notified_at: string | null;
          product_id: string | null;
        };
        Insert: {
          client_key?: string | null;
          confirm_token?: string;
          confirmation_sent_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          drop_id?: string | null;
          email: string;
          id?: string;
          notified_at?: string | null;
          product_id?: string | null;
        };
        Update: {
          client_key?: string | null;
          confirm_token?: string;
          confirmation_sent_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          drop_id?: string | null;
          email?: string;
          id?: string;
          notified_at?: string | null;
          product_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notify_requests_drop_id_fkey";
            columns: ["drop_id"];
            isOneToOne: false;
            referencedRelation: "drops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notify_requests_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "listed_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notify_requests_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notify_requests_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "storefront_products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          image_snapshot: string | null;
          order_id: string;
          price_paise_snapshot: number;
          product_id: string;
          title_snapshot: string;
          unavailable: boolean;
        };
        Insert: {
          image_snapshot?: string | null;
          order_id: string;
          price_paise_snapshot: number;
          product_id: string;
          title_snapshot: string;
          unavailable?: boolean;
        };
        Update: {
          image_snapshot?: string | null;
          order_id?: string;
          price_paise_snapshot?: number;
          product_id?: string;
          title_snapshot?: string;
          unavailable?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "listed_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "storefront_products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_events: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          id: number;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: never;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: never;
          order_id?: string;
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: Json;
          charge_amount: number | null;
          charge_currency: string;
          coupon_code: string | null;
          created_at: string;
          discount_paise: number;
          id: string;
          late_payment_notified_at: string | null;
          paid_at: string | null;
          payment_method: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          shipping_paise: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_paise: number;
          total_paise: number;
          tracking_url: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address: Json;
          charge_amount?: number | null;
          charge_currency?: string;
          coupon_code?: string | null;
          created_at?: string;
          discount_paise?: number;
          id?: string;
          late_payment_notified_at?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          shipping_paise?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_paise: number;
          total_paise: number;
          tracking_url?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: Json;
          charge_amount?: number | null;
          charge_currency?: string;
          coupon_code?: string | null;
          created_at?: string;
          discount_paise?: number;
          id?: string;
          late_payment_notified_at?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          shipping_paise?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_paise?: number;
          total_paise?: number;
          tracking_url?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_coupon_code_fkey";
            columns: ["coupon_code"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["code"];
          },
        ];
      };
      product_costs: {
        Row: {
          acquired_on: string | null;
          cost_paise: number | null;
          product_id: string;
          source: string | null;
          updated_at: string;
        };
        Insert: {
          acquired_on?: string | null;
          cost_paise?: number | null;
          product_id: string;
          source?: string | null;
          updated_at?: string;
        };
        Update: {
          acquired_on?: string | null;
          cost_paise?: number | null;
          product_id?: string;
          source?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "listed_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_costs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_costs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "storefront_products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt: string;
          id: string;
          product_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          alt?: string;
          id?: string;
          product_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          alt?: string;
          id?: string;
          product_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "listed_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "storefront_products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          brand: string | null;
          category_id: string;
          condition: Database["public"]["Enums"]["product_condition"];
          country_of_origin: string | null;
          created_at: string;
          description: string;
          drop_id: string | null;
          flaws: string | null;
          gender: Database["public"]["Enums"]["gender"];
          id: string;
          measurements: Json;
          original_price_paise: number | null;
          price_paise: number;
          published_at: string | null;
          reserved_by: string | null;
          reserved_order_id: string | null;
          reserved_until: string | null;
          search: unknown;
          slug: string;
          sold_at: string | null;
          status: Database["public"]["Enums"]["product_status"];
          style_tags: string[];
          tagged_size: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          category_id: string;
          condition: Database["public"]["Enums"]["product_condition"];
          country_of_origin?: string | null;
          created_at?: string;
          description?: string;
          drop_id?: string | null;
          flaws?: string | null;
          gender: Database["public"]["Enums"]["gender"];
          id?: string;
          measurements?: Json;
          original_price_paise?: number | null;
          price_paise: number;
          published_at?: string | null;
          reserved_by?: string | null;
          reserved_order_id?: string | null;
          reserved_until?: string | null;
          search?: unknown;
          slug: string;
          sold_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          style_tags?: string[];
          tagged_size?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          category_id?: string;
          condition?: Database["public"]["Enums"]["product_condition"];
          country_of_origin?: string | null;
          created_at?: string;
          description?: string;
          drop_id?: string | null;
          flaws?: string | null;
          gender?: Database["public"]["Enums"]["gender"];
          id?: string;
          measurements?: Json;
          original_price_paise?: number | null;
          price_paise?: number;
          published_at?: string | null;
          reserved_by?: string | null;
          reserved_order_id?: string | null;
          reserved_until?: string | null;
          search?: unknown;
          slug?: string;
          sold_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          style_tags?: string[];
          tagged_size?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_drop_id_fkey";
            columns: ["drop_id"];
            isOneToOne: false;
            referencedRelation: "drops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_reserved_order_id_fkey";
            columns: ["reserved_order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
      support_requests: {
        Row: {
          acknowledged_at: string | null;
          client_key: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          order_ref: string | null;
          phone: string | null;
          resolution: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["support_status"];
          ticket: string;
          topic: Database["public"]["Enums"]["support_topic"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          client_key?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          order_ref?: string | null;
          phone?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["support_status"];
          ticket?: string;
          topic: Database["public"]["Enums"]["support_topic"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          client_key?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          order_ref?: string | null;
          phone?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["support_status"];
          ticket?: string;
          topic?: Database["public"]["Enums"]["support_topic"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          created_at: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          product_id: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "listed_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "storefront_products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      insights_costs: {
        Row: {
          cost_paise: number | null;
          demo: boolean | null;
          product_id: string | null;
        };
        Relationships: [];
      };
      insights_items: {
        Row: {
          brand: string | null;
          category_id: string | null;
          condition: Database["public"]["Enums"]["product_condition"] | null;
          cost_paise: number | null;
          demo: boolean | null;
          drop_id: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          listed_at: string | null;
          order_id: string | null;
          original_price_paise: number | null;
          price_paise: number | null;
          product_id: string | null;
          product_price_paise: number | null;
          style_tags: string[] | null;
          tagged_size: string | null;
          unavailable: boolean | null;
        };
        Relationships: [];
      };
      insights_orders: {
        Row: {
          address: Json | null;
          coupon_code: string | null;
          created_at: string | null;
          customer_email: string | null;
          delivered_at: string | null;
          demo: boolean | null;
          discount_paise: number | null;
          id: string | null;
          packed_at: string | null;
          paid_at: string | null;
          payment_method: string | null;
          shipped_at: string | null;
          shipping_paise: number | null;
          status: Database["public"]["Enums"]["order_status"] | null;
          subtotal_paise: number | null;
          total_paise: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      listed_products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          condition: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin: string | null;
          created_at: string | null;
          description: string | null;
          drop_id: string | null;
          effective_status: Database["public"]["Enums"]["product_status"] | null;
          flaws: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string | null;
          measurements: Json | null;
          original_price_paise: number | null;
          price_paise: number | null;
          published_at: string | null;
          reserved_until: string | null;
          search: unknown;
          slug: string | null;
          sold_at: string | null;
          status: Database["public"]["Enums"]["product_status"] | null;
          style_tags: string[] | null;
          tagged_size: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          brand?: string | null;
          category_id?: string | null;
          condition?: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin?: string | null;
          created_at?: string | null;
          description?: string | null;
          drop_id?: string | null;
          effective_status?: never;
          flaws?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string | null;
          measurements?: Json | null;
          original_price_paise?: number | null;
          price_paise?: number | null;
          published_at?: string | null;
          reserved_until?: string | null;
          search?: unknown;
          slug?: string | null;
          sold_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"] | null;
          style_tags?: string[] | null;
          tagged_size?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          brand?: string | null;
          category_id?: string | null;
          condition?: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin?: string | null;
          created_at?: string | null;
          description?: string | null;
          drop_id?: string | null;
          effective_status?: never;
          flaws?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string | null;
          measurements?: Json | null;
          original_price_paise?: number | null;
          price_paise?: number | null;
          published_at?: string | null;
          reserved_until?: string | null;
          search?: unknown;
          slug?: string | null;
          sold_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"] | null;
          style_tags?: string[] | null;
          tagged_size?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_drop_id_fkey";
            columns: ["drop_id"];
            isOneToOne: false;
            referencedRelation: "drops";
            referencedColumns: ["id"];
          },
        ];
      };
      storefront_products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          condition: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin: string | null;
          created_at: string | null;
          description: string | null;
          drop_id: string | null;
          effective_status: Database["public"]["Enums"]["product_status"] | null;
          flaws: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string | null;
          measurements: Json | null;
          original_price_paise: number | null;
          price_paise: number | null;
          published_at: string | null;
          reserved_until: string | null;
          search: unknown;
          slug: string | null;
          sold_at: string | null;
          status: Database["public"]["Enums"]["product_status"] | null;
          style_tags: string[] | null;
          tagged_size: string | null;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          brand?: string | null;
          category_id?: string | null;
          condition?: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin?: string | null;
          created_at?: string | null;
          description?: string | null;
          drop_id?: string | null;
          effective_status?: never;
          flaws?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string | null;
          measurements?: Json | null;
          original_price_paise?: number | null;
          price_paise?: number | null;
          published_at?: string | null;
          reserved_until?: string | null;
          search?: unknown;
          slug?: string | null;
          sold_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"] | null;
          style_tags?: string[] | null;
          tagged_size?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          brand?: string | null;
          category_id?: string | null;
          condition?: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin?: string | null;
          created_at?: string | null;
          description?: string | null;
          drop_id?: string | null;
          effective_status?: never;
          flaws?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string | null;
          measurements?: Json | null;
          original_price_paise?: number | null;
          price_paise?: number | null;
          published_at?: string | null;
          reserved_until?: string | null;
          search?: unknown;
          slug?: string | null;
          sold_at?: string | null;
          status?: Database["public"]["Enums"]["product_status"] | null;
          style_tags?: string[] | null;
          tagged_size?: string | null;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_drop_id_fkey";
            columns: ["drop_id"];
            isOneToOne: false;
            referencedRelation: "drops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_product_holds: {
        Args: { product_ids: string[] };
        Returns: {
          holder_email: string;
          product_id: string;
          reserved_order_id: string;
          reserved_until: string;
        }[];
      };
      admin_products_missing_cost: {
        Args: { p_limit: number; p_offset: number };
        Returns: {
          brand: string;
          id: string;
          image_alt: string;
          image_url: string;
          price_paise: number;
          slug: string;
          sold_at: string;
          source: string;
          status: Database["public"]["Enums"]["product_status"];
          title: string;
        }[];
      };
      apply_coupon: { Args: { code: string; order_id: string }; Returns: Json };
      attach_reservations: { Args: { order_id: string }; Returns: string[] };
      auth_account_status:
        | { Args: { p_email: string }; Returns: string }
        | { Args: { p_client_key?: string; p_email: string }; Returns: string };
      cancel_stale_orders: { Args: never; Returns: number };
      confirm_notify: { Args: { token: string }; Returns: number };
      coupon_quote: {
        Args: { code: string; subtotal_paise: number; user_id: string };
        Returns: Json;
      };
      drop_is_live: { Args: { drop_id: string }; Returns: boolean };
      insights_breakdown: {
        Args: {
          p_demo?: boolean;
          p_dimension: string;
          p_from: string;
          p_to: string;
        };
        Returns: Json;
      };
      insights_customers: {
        Args: { p_demo?: boolean; p_from: string; p_to: string };
        Returns: Json;
      };
      insights_fulfilment: {
        Args: { p_demo?: boolean; p_from: string; p_to: string };
        Returns: Json;
      };
      insights_funnel: {
        Args: { p_demo?: boolean; p_from: string; p_to: string };
        Returns: Json;
      };
      insights_heatmap: {
        Args: { p_demo?: boolean; p_from: string; p_to: string };
        Returns: Json;
      };
      insights_inventory: { Args: { p_demo?: boolean }; Returns: Json };
      insights_marketing: {
        Args: { p_demo?: boolean; p_from: string; p_to: string };
        Returns: Json;
      };
      insights_prepare_demo: { Args: never; Returns: undefined };
      insights_summary: {
        Args: { p_demo?: boolean; p_from: string; p_to: string };
        Returns: Json;
      };
      insights_timeseries: {
        Args: {
          p_bucket: string;
          p_demo?: boolean;
          p_from: string;
          p_to: string;
        };
        Returns: Json;
      };
      is_admin: { Args: never; Returns: boolean };
      is_slug: { Args: { value: string }; Returns: boolean };
      live_drop_ids: { Args: never; Returns: string[] };
      mark_order_paid: {
        Args: { order_id: string; payment_id: string };
        Returns: Json;
      };
      measurements_are_valid: { Args: { m: Json }; Returns: boolean };
      product_effective_status: {
        Args: {
          p_reserved_until: string;
          p_status: Database["public"]["Enums"]["product_status"];
        };
        Returns: Database["public"]["Enums"]["product_status"];
      };
      product_facets: {
        Args: { category_ids?: string[]; query?: string };
        Returns: Json;
      };
      product_search_document: {
        Args: {
          brand: string;
          description: string;
          style_tags: string[];
          title: string;
        };
        Returns: unknown;
      };
      purge_old_support_requests: { Args: never; Returns: number };
      purge_unconfirmed_notify_requests: { Args: never; Returns: number };
      release_expired_reservations: { Args: never; Returns: number };
      release_order_reservations: {
        Args: { order_id: string };
        Returns: number;
      };
      request_notify: {
        Args: {
          client_key?: string;
          drop_id?: string;
          email: string;
          product_id?: string;
        };
        Returns: Json;
      };
      reserve_products: {
        Args: { product_ids: string[]; user_id: string };
        Returns: string[];
      };
      search_products: {
        Args: { query: string };
        Returns: {
          brand: string | null;
          category_id: string | null;
          condition: Database["public"]["Enums"]["product_condition"] | null;
          country_of_origin: string | null;
          created_at: string | null;
          description: string | null;
          drop_id: string | null;
          effective_status: Database["public"]["Enums"]["product_status"] | null;
          flaws: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string | null;
          measurements: Json | null;
          original_price_paise: number | null;
          price_paise: number | null;
          published_at: string | null;
          reserved_until: string | null;
          search: unknown;
          slug: string | null;
          sold_at: string | null;
          status: Database["public"]["Enums"]["product_status"] | null;
          style_tags: string[] | null;
          tagged_size: string | null;
          title: string | null;
          updated_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "listed_products";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      start_checkout: {
        Args: {
          address: Json;
          free_shipping_above_paise: number;
          product_ids: string[];
          shipping_flat_paise: number;
          user_id: string;
        };
        Returns: Json;
      };
      submit_support_request: {
        Args: {
          client_key?: string;
          email: string;
          message: string;
          name: string;
          order_ref?: string;
          phone?: string;
          topic: Database["public"]["Enums"]["support_topic"];
          user_id?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      coupon_type: "percent" | "flat";
      gender: "men" | "women" | "unisex";
      order_status:
        "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
      product_condition: "new_with_tags" | "like_new" | "good" | "fair";
      product_status: "draft" | "available" | "reserved" | "sold";
      support_status: "open" | "in_progress" | "resolved";
      support_topic:
        "order" | "cancellation" | "return" | "refund" | "privacy" | "grievance" | "other";
      user_role: "customer" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      coupon_type: ["percent", "flat"],
      gender: ["men", "women", "unisex"],
      order_status: ["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"],
      product_condition: ["new_with_tags", "like_new", "good", "fair"],
      product_status: ["draft", "available", "reserved", "sold"],
      support_status: ["open", "in_progress", "resolved"],
      support_topic: ["order", "cancellation", "return", "refund", "privacy", "grievance", "other"],
      user_role: ["customer", "admin"],
    },
  },
} as const;
