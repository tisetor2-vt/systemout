import type { Category, Product } from "@/lib/types";

export const categories: Category[] = [
  { id: "1", name: "Roupas" },
  { id: "2", name: "Acessorios" },
  { id: "3", name: "Calcados" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Camiseta Premium",
    description: "Modelagem moderna, tecido macio e caimento premium.",
    price: 129.9,
    stock: 50,
    category_id: "1",
    image_urls: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"],
    material: "Algodao",
    sizes: ["P", "M", "G"],
    colors: ["#000000", "#FFFFFF"],
    featured: true,
    active: true,
    visible_in_catalog: true,
  },
  {
    id: "2",
    name: "Relogio Luxo",
    description: "Elegancia e precisao para o dia a dia.",
    price: 349.9,
    stock: 15,
    category_id: "2",
    image_urls: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d"],
    featured: true,
    active: true,
    visible_in_catalog: true,
  },
];
