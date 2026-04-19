import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Reading CSV...');
  const csvText = fs.readFileSync(path.join(process.cwd(), 'data', 'authors-export.csv'), 'utf-8');
  
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Found ${records.length} records. Processing...`);

  let updatedCount = 0;

  for (const record of records) {
    const slug = record.user_login;
    let description = record.description.trim();
    
    if (!description || description === '0') continue; // Skip empty descriptions

    // Extract years like (1835-1913) or (1835–1913) (en-dash vs hyphen)
    let birthYear: number | null = null;
    let deathYear: number | null = null;

    // Matches: (1835-1913), (1835 - 1913), (1835–1913)
    const yearMatch = description.match(/\(\s*(\d{4})\s*[-–]\s*(\d{4})\s*\)/);
    if (yearMatch) {
      birthYear = parseInt(yearMatch[1], 10);
      deathYear = parseInt(yearMatch[2], 10);
    } else {
      // Look for format like: born April 19, 1836 ... passed away on February 2, 1895
      const bornMatch = description.match(/born\s.*?(?:,\s)?(\d{4})/i);
      const diedMatch = description.match(/(?:died|passed away)\s.*?(?:,\s)?(\d{4})/i);
      if (bornMatch) birthYear = parseInt(bornMatch[1], 10);
      if (diedMatch) deathYear = parseInt(diedMatch[1], 10);
      
      // Look for format like: 19th-century -> nothing to extract definitively 
      // or "born January 7, 1858 – died January 8, 1945"
      const bornDiedMatch = description.match(/born\s.*?(\d{4})\s*[-–]\s*died\s.*?(\d{4})/i);
      if (bornDiedMatch) {
        birthYear = parseInt(bornDiedMatch[1], 10);
        deathYear = parseInt(bornDiedMatch[2], 10);
      }
    }

    try {
      const [updated] = await sql`
        UPDATE authors 
        SET 
          description = ${description},
          birth_year = COALESCE(${birthYear}, birth_year),
          death_year = COALESCE(${deathYear}, death_year)
        WHERE slug = ${slug}
        RETURNING id;
      `;
      
      if (updated) {
        console.log(`Updated [${slug}] - Birth: ${birthYear}, Death: ${deathYear}`);
        updatedCount++;
      } else {
        console.log(`Warning: Author slug [${slug}] not found in database.`);
      }
    } catch (err) {
      console.error(`Error updating author ${slug}:`, err);
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} authors with biographies/lifespans.`);
}

main().catch(console.error);
