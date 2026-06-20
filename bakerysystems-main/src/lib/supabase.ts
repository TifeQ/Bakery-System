import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gqcqkqsjabllhlbjzqde.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3FrcXNqYWJsbGhsYmp6cWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjIxMTMsImV4cCI6MjA5Njk5ODExM30.AxSPPO6ieBBElgsHSl-YI8eWA6tp-jFyBmJTyKy9MQc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number; // in kobo
  image_url: string | null;
  category: "Bread" | "Pastries" | "Custom Cakes" | string;
  is_available: boolean;
};

export const formatNaira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
