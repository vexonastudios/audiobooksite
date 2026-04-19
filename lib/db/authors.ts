import { sql } from './index';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Author {
  id: string;
  slug: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthorRow {
  id: string;
  slug: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function rowToAuthor(row: AuthorRow): Author {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    birthYear: row.birth_year,
    deathYear: row.death_year,
    description: row.description,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────
export async function getAllAuthors(): Promise<Author[]> {
  const rows = await sql`
    SELECT * FROM authors ORDER BY name ASC
  ` as AuthorRow[];
  return rows.map(rowToAuthor);
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const rows = await sql`SELECT * FROM authors WHERE slug = ${slug}` as AuthorRow[];
  return rows[0] ? rowToAuthor(rows[0]) : null;
}

export async function getAuthorById(id: string): Promise<Author | null> {
  const rows = await sql`SELECT * FROM authors WHERE id = ${id}` as AuthorRow[];
  return rows[0] ? rowToAuthor(rows[0]) : null;
}

export async function createAuthor(data: AuthorInput): Promise<string> {
  const id = data.id || `a${Date.now()}`;
  await sql`
    INSERT INTO authors (id, slug, name, birth_year, death_year, description, image_url)
    VALUES (
      ${id}, ${data.slug}, ${data.name},
      ${data.birthYear ?? null}, ${data.deathYear ?? null},
      ${data.description ?? null}, ${data.imageUrl ?? null}
    )
  `;
  return id;
}

export async function updateAuthor(id: string, data: Partial<AuthorInput>): Promise<void> {
  await sql`
    UPDATE authors SET
      slug        = COALESCE(${data.slug ?? null}, slug),
      name        = COALESCE(${data.name ?? null}, name),
      birth_year  = COALESCE(${data.birthYear ?? null}, birth_year),
      death_year  = COALESCE(${data.deathYear ?? null}, death_year),
      description = COALESCE(${data.description ?? null}, description),
      image_url   = COALESCE(${data.imageUrl ?? null}, image_url),
      updated_at  = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteAuthor(id: string): Promise<void> {
  await sql`DELETE FROM authors WHERE id = ${id}`;
}

// ── Input type ────────────────────────────────────────────────────────────────
export interface AuthorInput {
  id?: string;
  slug: string;
  name: string;
  birthYear?: number | null;
  deathYear?: number | null;
  description?: string | null;
  imageUrl?: string | null;
}
