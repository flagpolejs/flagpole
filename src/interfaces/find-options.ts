export interface FindOptions {
  findBy?: "text" | "value" | "html";
  offset?: number;
}

export interface FindAllOptions extends FindOptions {
  limit?: number;
}

export type FindParams = {
  contains: string | null;
  matches: RegExp | null;
  opts: FindOptions | FindAllOptions | null;
};
