import * as fs from 'fs';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const sql = neon(process.env.DATABASE_URL!);

async function updateBooks() {
  const xmlData = fs.readFileSync(path.resolve(__dirname, '../scrollreader.WordPress.2026-04-19.xml'), 'utf-8');
  const items = xmlData.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  const postsByWpId: Record<string, any> = {};
  const audiobooksBySlug: Record<string, any> = {};
  
  for (const item of items) {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';
    const idMatch = item.match(/<wp:post_id>(.*?)<\/wp:post_id>/);
    const id = idMatch ? idMatch[1] : '';
    const typeMatch = item.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/) || item.match(/<wp:post_type>(.*?)<\/wp:post_type>/);
    const type = typeMatch ? typeMatch[1] : '';
    const parentMatch = item.match(/<wp:post_parent>(.*?)<\/wp:post_parent>/);
    const parent = parentMatch ? parentMatch[1] : '0';
    
    if (type === 'post') {
      const nameMatch = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/) || item.match(/<wp:post_name>(.*?)<\/wp:post_name>/);
      const slug = nameMatch ? nameMatch[1] : '';
      postsByWpId[id] = { id, title, slug, children: [] };
      audiobooksBySlug[slug] = postsByWpId[id];
    } else if (type === 'attachment') {
      const urlMatch = item.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/);
      const url = urlMatch ? urlMatch[1] : '';
      
      // Attempt to extract dimensions from serialized PHP array
      const metaMatch = item.match(/(?:wp:meta_value><\!\[CDATA\[a:\d+:\{|s:\d+:"_wp_attachment_metadata".*?a:\d+:\{)(.*?)s:\d+:"sizes"/);
      let width = 0, height = 0;
      if (metaMatch) {
         const wMatch = metaMatch[1].match(/s:5:"width";i:(\d+)/);
         const hMatch = metaMatch[1].match(/s:6:"height";i:(\d+)/);
         if (wMatch) width = parseInt(wMatch[1]);
         if (hMatch) height = parseInt(hMatch[1]);
      } else {
         // rough fallback from filename if no meta match:
         const widthGuess = url.match(/(\d+)x(\d+)/);
         if (widthGuess && parseInt(widthGuess[1]) > 50) {
            width = parseInt(widthGuess[1]);
            height = parseInt(widthGuess[2]);
         } else if (item.match(/s:5:"width";i:(\d+)/)) {
            const ww = item.match(/s:5:"width";i:(\d+)/);
            const hh = item.match(/s:6:"height";i:(\d+)/);
            if (ww) width = parseInt(ww[1]);
            if (hh) height = parseInt(hh[1]);
         }
      }

      if (postsByWpId[parent]) {
         postsByWpId[parent].children.push({ url, width, height });
      } else {
         // handle case where attachment comes before parent in XML (less likely, but possible)
         if (!postsByWpId[parent]) postsByWpId[parent] = { children: [] };
         postsByWpId[parent].children.push({ url, width, height });
      }
    }
  }

  // Fetch current database records
  const dbBooks = await sql`SELECT id, slug, title, cover_image, thumbnail_url FROM audiobooks`;
  console.log(`Found ${dbBooks.length} audiobooks in database.`);

  let updatedCount = 0;

  for (const dbBook of dbBooks) {
    const wpPost = audiobooksBySlug[dbBook.slug];
    if (!wpPost || !wpPost.children || wpPost.children.length === 0) continue;

    let bestSquare = '';
    let bestTall = '';

    for (const file of wpPost.children) {
       if (!file.url) continue;
       const ratio = file.width && file.height ? file.width / file.height : 0;
       
       if (ratio === 1 || (ratio > 0.9 && ratio < 1.1)) {
          // It's square
          if (!bestSquare || file.url.includes('1024') || file.url.toLowerCase().includes('audiobook')) {
             bestSquare = file.url;
          }
       } else if (ratio > 0 && ratio < 0.9) {
          // It's tall
          if (!bestTall || file.url.includes('Tall') || file.url.includes('-Cover') || file.url.toLowerCase().includes('book-cover')) {
             bestTall = file.url;
          }
       } else {
          // Fallback based on filename without meta
          if (file.url.includes('1024') || file.url.includes('400-') || file.url.match(/-(sq|square)\./i)) {
             bestSquare = file.url;
          } else if (file.url.includes('t-') || file.url.includes('Tall') || file.url.match(/-(tall)\./i)) {
             bestTall = file.url;
          }
       }
    }
    
    // In case logic failed but we have 2 images
    if (!bestSquare && !bestTall && wpPost.children.length >= 2) {
       for (const file of wpPost.children) {
          if (file.url.toLowerCase().includes('1024') || file.url.toLowerCase().includes('audiobook') || file.url.toLowerCase().includes('1x1')) bestSquare = file.url;
          else if (file.url.toLowerCase().includes('tall') || file.url.toLowerCase().includes('book') || file.url.toLowerCase().includes('2x3')) bestTall = file.url;
       }
    }
    
    // Default to the same image if we couldn't find distinct ones
    if (!bestTall && bestSquare) bestTall = bestSquare;
    if (!bestSquare && bestTall) bestSquare = bestTall;

    if (bestTall || bestSquare) {
       // Only update if they differ from what's currently there (and are not just empty)
       if (bestTall !== dbBook.cover_image || bestSquare !== dbBook.thumbnail_url) {
          console.log(`Updating ${dbBook.slug}:\n  Tall: ${bestTall}\n  Sq:   ${bestSquare}`);
          await sql`
            UPDATE audiobooks 
            SET cover_image = ${bestTall || dbBook.cover_image}, 
                thumbnail_url = ${bestSquare || dbBook.thumbnail_url}
            WHERE id = ${dbBook.id}
          `;
          updatedCount++;
       }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} audiobooks with tall/square image URLs.`);
}

updateBooks().catch(e => console.error(e));
