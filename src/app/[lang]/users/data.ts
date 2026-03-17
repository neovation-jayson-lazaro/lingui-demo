export type User = {
  slug: string;
  name: string;
  id: number;
};

export const USERS: User[] = [
  { slug: "john1", name: "John", id: 1 },
  { slug: "jane2", name: "Jane", id: 2 },
  { slug: "joe3", name: "Joe", id: 3 },
];
