import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

type Category = { id: string; name: string; slug: string; sort_order: number };

const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) || []);
    });
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange("all")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          activeCategory === "all"
            ? "gradient-primary text-primary-foreground neon-border"
            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"
        }`}
      >
        <Package className="w-4 h-4" />
        Tất cả sản phẩm
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.slug)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "gradient-primary text-primary-foreground neon-border"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
