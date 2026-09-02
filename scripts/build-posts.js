// admin/build-posts.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const OUT_FILE = path.join(__dirname, '..', 'posts.json');

function slugify(filename) {
  return path.basename(filename, path.extname(filename));
}

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.writeFileSync(OUT_FILE, '[]');
    console.log('No content/posts folder found, wrote empty posts.json');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  const posts = files.map(file => {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    let parsedGallery = [];
    if (Array.isArray(data.gallery)) {
      parsedGallery = data.gallery
        .map(item => {
          if (!item) return null;
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.src) return item.src;
          return null;
        })
        .filter(Boolean);
    }

    return {
      slug: slugify(file),
      date: data.date || '',
      tag: data.tag || 'General',
      title: data.title || 'Untitled',
      image: data.image || '',
      excerpt: data.excerpt || '',
      body: content ? content.trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : [],
      gallery: parsedGallery
    };
  });

  posts.sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    if (isNaN(da) || isNaN(db)) return b.slug.localeCompare(a.slug);
    return db - da;
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`Successfully wrote ${posts.length} post(s) to ${OUT_FILE}`);
}

build();
