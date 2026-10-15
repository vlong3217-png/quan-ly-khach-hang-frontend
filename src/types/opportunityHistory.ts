export type OpportunityChangeField =
  | 'stage'
  | 'expected_revenue'
  | 'expected_close_date'
  | 'owner'
  | 'win_probability'
  | 'quote'
  | 'other'

export interface OpportunityFieldChange {
  id: string
  opportunity_id: string
  field: OpportunityChangeField
  field_label: string
  old_value: string
  new_value: string
  old_display?: string
  new_display?: string
  reason?: string
  changed_by_id?: number
  changed_by_name: string
  changed_at: string
}

export interface RecordChangePayload {
  opportunity_id: string
  field: OpportunityChangeField
  field_label: string
  old_value: string
  new_value: string
  old_display?: string
  new_display?: string
  reason?: string
  changed_by_id?: number
  changed_by_name?: string
}
