import * as fs from 'fs';
import * as path from 'path';

function parseXml() {
  const xmlData = fs.readFileSync(path.resolve(__dirname, '../scrollreader.WordPress.2026-04-19.xml'), 'utf-8');
  
  // Extract all <item> blocks
  const items = xmlData.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  const posts: Record<string, any> = {};
  const attachments: Record<string, any[]> = {};
  
  for (const item of items) {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    const idMatch = item.match(/<wp:post_id>(.*?)<\/wp:post_id>/);
    const id = idMatch ? idMatch[1] : '';
    
    const typeMatch = item.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/);
    const type = typeMatch ? typeMatch[1] : '';
    
    const parentMatch = item.match(/<wp:post_parent>(.*?)<\/wp:post_parent>/);
    const parent = parentMatch ? parentMatch[1] : '0';
    
    if (type === 'attachment') {
      const urlMatch = item.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/);
      const url = urlMatch ? urlMatch[1] : '';
      if (!attachments[parent]) attachments[parent] = [];
      attachments[parent].push({ title, url });
    } else if (type === 'post') {
      const nameMatch = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/) || item.match(/<wp:post_name>(.*?)<\/wp:post_name>/);
      const slug = nameMatch ? nameMatch[1] : '';
      posts[id] = { id, title, slug };
    }
  }

  // Debug first 5 posts that have multiple attachments
  let count = 0;
  for (const [id, post] of Object.entries(posts)) {
    const atts = attachments[id] || [];
    if (atts.length > 0) {
      console.log(`\nPost: ${post.title} (${post.slug})`);
      for (const a of atts) console.log(` - ATTACHMENT: ${a.url}`);
      count++;
      if (count > 5) break;
    }
  }
}

parseXml();
