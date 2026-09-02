

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Since this file lives inside admin/, '..' points to the repository root
const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');
const OUT_FILE = path.join(__dirname, '..', 'posts.json');

function slugify(filename) {
  return path.basename(filename, path.extname(filename));
}

function build() {
  // If the content/posts folder doesn't exist yet, create an empty posts.json
  if (!fs.existsSync(POSTS_DIR)) {
    fs.writeFileSync(OUT_FILE, '[]');
    console.log('No content/posts folder found, wrote empty posts.json');
    return;
  }

  // Get all .md files from content/posts/
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  const posts = files.map(file => {
    const filePath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    // Safely parse gallery images whether saved as plain strings or { src: "..." } objects
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

  // Sort newest first based on date string. Fall back to slug comparison if invalid.
  posts.sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    if (isNaN(da) || isNaN(db)) return b.slug.localeCompare(a.slug);
    return db - da;
  });

  // Write JSON output to repository root
  fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`Successfully wrote ${posts.length} post(s) to ${OUT_FILE}`);
}

build();
