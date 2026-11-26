
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "liked_foods": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "liked_foods_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"meal_items": {
                  Row: {
                    "amount": string | null,"carbs_g": number,"fat_g": number,"id": string,"kcal": number,"meal_id": string,"name": string,"origin": Database["public"]['Enums']["item_origin"],"position": number,"protein_g": number,"user_id": string
                  }
                  Insert: {
                    "amount"?: string | null,"carbs_g"?: number,"fat_g"?: number,"id"?: string,"kcal": number,"meal_id": string,"name": string,"origin": Database["public"]['Enums']["item_origin"],"position": number,"protein_g"?: number,"user_id": string
                  }
                  Update: {
                    "amount"?: string | null,"carbs_g"?: number,"fat_g"?: number,"id"?: string,"kcal"?: number,"meal_id"?: string,"name"?: string,"origin"?: Database["public"]['Enums']["item_origin"],"position"?: number,"protein_g"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_items_meal_id_user_id_fkey"
      columns: ["meal_id","user_id"]
isOneToOne: false
      referencedRelation: "meals"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"meals": {
                  Row: {
                    "carbs_g": number,"confidence": number | null,"created_at": string,"eaten_at": string,"fat_g": number,"id": string,"is_demo": boolean,"kcal": number,"local_date": string,"meal_type": Database["public"]['Enums']["meal_kind"],"name": string,"note": string | null,"portion": number,"protein_g": number,"source": Database["public"]['Enums']["meal_source"],"user_id": string
                  }
                  Insert: {
                    "carbs_g"?: number,"confidence"?: number | null,"created_at"?: string,"eaten_at": string,"fat_g"?: number,"id"?: string,"is_demo"?: boolean,"kcal": number,"local_date": string,"meal_type": Database["public"]['Enums']["meal_kind"],"name": string,"note"?: string | null,"portion"?: number,"protein_g"?: number,"source": Database["public"]['Enums']["meal_source"],"user_id": string
                  }
                  Update: {
                    "carbs_g"?: number,"confidence"?: number | null,"created_at"?: string,"eaten_at"?: string,"fat_g"?: number,"id"?: string,"is_demo"?: boolean,"kcal"?: number,"local_date"?: string,"meal_type"?: Database["public"]['Enums']["meal_kind"],"name"?: string,"note"?: string | null,"portion"?: number,"protein_g"?: number,"source"?: Database["public"]['Enums']["meal_source"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meals_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "activity": Database["public"]['Enums']["activity_kind"],"age_recorded_on": string | null,"age_years": number | null,"created_at": string,"demo_mode": boolean,"eligible_confirmed_at": string | null,"goal_weight_kg": number | null,"height_cm": number | null,"id": string,"pace_kg_week": number,"sex": Database["public"]['Enums']["sex_kind"] | null,"start_date": string | null,"start_weight_kg": number | null,"timezone": string,"updated_at": string
                  }
                  Insert: {
                    "activity"?: Database["public"]['Enums']["activity_kind"],"age_recorded_on"?: string | null,"age_years"?: number | null,"created_at"?: string,"demo_mode"?: boolean,"eligible_confirmed_at"?: string | null,"goal_weight_kg"?: number | null,"height_cm"?: number | null,"id": string,"pace_kg_week"?: number,"sex"?: Database["public"]['Enums']["sex_kind"] | null,"start_date"?: string | null,"start_weight_kg"?: number | null,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "activity"?: Database["public"]['Enums']["activity_kind"],"age_recorded_on"?: string | null,"age_years"?: number | null,"created_at"?: string,"demo_mode"?: boolean,"eligible_confirmed_at"?: string | null,"goal_weight_kg"?: number | null,"height_cm"?: number | null,"id"?: string,"pace_kg_week"?: number,"sex"?: Database["public"]['Enums']["sex_kind"] | null,"start_date"?: string | null,"start_weight_kg"?: number | null,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"scans": {
                  Row: {
                    "created_at": string,"id": string,"input_tokens": number | null,"model": string | null,"outcome": Database["public"]['Enums']["scan_outcome"],"output_tokens": number | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"input_tokens"?: number | null,"model"?: string | null,"outcome": Database["public"]['Enums']["scan_outcome"],"output_tokens"?: number | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"input_tokens"?: number | null,"model"?: string | null,"outcome"?: Database["public"]['Enums']["scan_outcome"],"output_tokens"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "scans_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"weigh_ins": {
                  Row: {
                    "created_at": string,"id": string,"is_demo": boolean,"measured_on": string,"user_id": string,"weight_kg": number
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_demo"?: boolean,"measured_on": string,"user_id": string,"weight_kg": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_demo"?: boolean,"measured_on"?: string,"user_id"?: string,"weight_kg"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "weigh_ins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "daily_totals": {
                  Row: {
                    "carbs_g": number | null,"fat_g": number | null,"is_demo": boolean | null,"kcal": number | null,"local_date": string | null,"meals": number | null,"protein_g": number | null,"user_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "meals_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "activity_kind": "light"|"moderate"|"active","item_origin": "model"|"swap"|"added"|"adjustment"|"catalog","meal_kind": "breakfast"|"lunch"|"dinner"|"snack","meal_source": "photo"|"search"|"recent"|"quick_add"|"idea","scan_outcome": "ok"|"low_confidence"|"no_food"|"failed"|"limited","sex_kind": "female"|"male"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "activity_kind": ["light", "moderate", "active"],"item_origin": ["model", "swap", "added", "adjustment", "catalog"],"meal_kind": ["breakfast", "lunch", "dinner", "snack"],"meal_source": ["photo", "search", "recent", "quick_add", "idea"],"scan_outcome": ["ok", "low_confidence", "no_food", "failed", "limited"],"sex_kind": ["female", "male"]
          }
        }
} as const
