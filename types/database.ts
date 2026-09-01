export type ProjectKind = "photo" | "video";

export type ProjectVideoStatus =
  | "waiting"
  | "uploading"
  | "processing"
  | "ready"
  | "errored";

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
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          kind: ProjectKind;
          cover_image_path: string | null;
          cover_alt_text: string | null;
          cover_width: number | null;
          cover_height: number | null;
          is_published: boolean;
          is_featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          kind: ProjectKind;
          cover_image_path?: string | null;
          cover_alt_text?: string | null;
          cover_width?: number | null;
          cover_height?: number | null;
          is_published?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          kind?: ProjectKind;
          cover_image_path?: string | null;
          cover_alt_text?: string | null;
          cover_width?: number | null;
          cover_height?: number | null;
          is_published?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_images: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          alt_text: string | null;
          caption: string | null;
          width: number | null;
          height: number | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          alt_text?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          storage_path?: string;
          alt_text?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_videos: {
        Row: {
          id: string;
          project_id: string;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          mux_upload_id: string | null;
          source_path: string | null;
          status: ProjectVideoStatus;
          title: string | null;
          caption: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          source_path?: string | null;
          status?: ProjectVideoStatus;
          title?: string | null;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          source_path?: string | null;
          status?: ProjectVideoStatus;
          title?: string | null;
          caption?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_videos_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: string;
          portrait_path: string | null;
          portrait_alt: string | null;
          portrait_width: number | null;
          portrait_height: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portrait_path?: string | null;
          portrait_alt?: string | null;
          portrait_width?: number | null;
          portrait_height?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portrait_path?: string | null;
          portrait_alt?: string | null;
          portrait_width?: number | null;
          portrait_height?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type ProjectImageRow =
  Database["public"]["Tables"]["project_images"]["Row"];
export type ProjectImageInsert =
  Database["public"]["Tables"]["project_images"]["Insert"];
export type ProjectImageUpdate =
  Database["public"]["Tables"]["project_images"]["Update"];

export type ProjectVideoRow =
  Database["public"]["Tables"]["project_videos"]["Row"];
export type ProjectVideoInsert =
  Database["public"]["Tables"]["project_videos"]["Insert"];
export type ProjectVideoUpdate =
  Database["public"]["Tables"]["project_videos"]["Update"];

export type SiteSettingsRow =
  Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteSettingsUpdate =
  Database["public"]["Tables"]["site_settings"]["Update"];
