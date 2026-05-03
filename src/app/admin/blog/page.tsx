import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import ScrollworkCorners from "@/components/academy/ScrollworkCorners";
import AcademyCard from "@/components/academy/AcademyCard";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "Blog Manager — Admin" };

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: "draft" | "published";
  tags: string[] | null;
  created_at: string;
  published_at: string | null;
};

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      Publicado
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 font-cinzel text-[8px] uppercase tracking-widest bg-white/5 text-gray-500 border border-white/10">
      Borrador
    </span>
  );
}

export default async function BlogManagerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/academy/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/academy/login");

  const adminSb = await createAdminClient();

  const { data: posts } = await adminSb
    .from("blog_posts")
    .select("id, slug, title, excerpt, status, tags, created_at, published_at")
    .order("created_at", { ascending: false });

  const allPosts = (posts ?? []) as BlogPost[];
  const totalPosts = allPosts.length;
  const publishedCount = allPosts.filter((p) => p.status === "published").length;
  const draftCount = allPosts.filter((p) => p.status === "draft").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059] mb-1">
            Administración
          </p>
          <h1 className="font-cinzel text-2xl text-white">Blog Manager</h1>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#d4b06a] text-[#020617] font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo post
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total posts", value: totalPosts, icon: FileText },
          { label: "Publicados", value: publishedCount, accent: "text-emerald-400" },
          { label: "Borradores", value: draftCount, accent: "text-gray-500" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="relative bg-[#16213e] border border-white/5 p-5 overflow-hidden"
          >
            <ScrollworkCorners size={36} opacity={0.7} />
            {Icon && <Icon className="w-4 h-4 text-[#C5A059] mb-3" />}
            <p className="font-cinzel text-[9px] uppercase tracking-widest text-gray-500 mb-1">
              {label}
            </p>
            <p className={`font-cinzel text-2xl ${accent ?? "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <AcademyCard>
        <h2 className="font-cinzel text-sm uppercase tracking-widest text-white mb-6">
          Posts
          <span className="ml-3 font-crimson text-xs text-gray-500 normal-case">
            {totalPosts} entradas
          </span>
        </h2>

        {allPosts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-[#C5A059]/20 mx-auto mb-4" />
            <p className="font-cinzel text-sm text-gray-600 mb-2">No hay posts aún</p>
            <p className="font-crimson text-sm text-gray-700 mb-6">
              Crea tu primer artículo para el blog.
            </p>
            <Link
              href="/admin/blog/nuevo"
              className="inline-flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] font-cinzel text-[10px] uppercase tracking-widest px-4 py-2.5 transition-colors hover:bg-[#C5A059]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear primer post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Título", "Slug", "Estado", "Fecha", "Tags", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className="text-left font-cinzel text-[9px] uppercase tracking-widest text-gray-600 pb-3 pr-4 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition"
                  >
                    <td className="py-3 pr-4 max-w-[200px]">
                      <p className="font-crimson text-sm text-gray-200 leading-tight truncate">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="font-crimson text-xs text-gray-600 truncate mt-0.5">
                          {post.excerpt.substring(0, 60)}…
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-cinzel text-[9px] text-gray-500 truncate max-w-[120px] block">
                        {post.slug}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-crimson text-xs text-gray-500 whitespace-nowrap">
                        {new Date(post.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {post.published_at && (
                        <p className="font-cinzel text-[8px] text-emerald-500/60 mt-0.5">
                          pub:{" "}
                          {new Date(post.published_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(post.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-1.5 py-0.5 bg-[#C5A059]/10 text-[#C5A059]/70 font-cinzel text-[7px] uppercase tracking-widest border border-[#C5A059]/15"
                          >
                            {tag}
                          </span>
                        ))}
                        {(post.tags ?? []).length > 3 && (
                          <span className="font-cinzel text-[7px] text-gray-600">
                            +{(post.tags ?? []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/blog/${post.id}/editar`}
                          className="flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-widest text-[#C5A059]/70 hover:text-[#C5A059] transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AcademyCard>
    </div>
  );
}
