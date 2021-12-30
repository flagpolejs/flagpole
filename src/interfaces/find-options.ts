export interface FindOptions {
  findBy?: "text" | "value" | "html";
  offset?: number;
}

export interface FindAllOptions extends FindOptions {
  limit?: number;
}
