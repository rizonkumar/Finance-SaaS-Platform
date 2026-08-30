import { cn } from "@/lib/utils";

const COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
} as const;

type Props = {
  caption?: string;
  columns?: keyof typeof COLUMNS;
  className?: string;
  children: React.ReactNode;
};

export const StatGroup = ({
  caption,
  columns = 3,
  className,
  children,
}: Props) => (
  <section className={className}>
    {caption && <p className="label-12 mb-2 px-0.5 text-gray-800">{caption}</p>}
    <div className={cn("grid grid-cols-1 gap-4", COLUMNS[columns])}>
      {children}
    </div>
  </section>
);
