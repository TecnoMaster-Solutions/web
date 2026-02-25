export type Column<T> = {
  key: keyof T;
  header: string | React.ReactNode;
  render?: (row: T) => React.ReactNode;
  priority?: "high" | "medium" | "low";
  width?: string;
};
