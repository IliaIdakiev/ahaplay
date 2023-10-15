export interface IBase {
  id: string;
  create_date: Date;
  update_date: Date;
}

export type IBaseKeys = keyof IBase;
