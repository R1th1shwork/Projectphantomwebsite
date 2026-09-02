// Reads every markdown file in content/posts, turns the frontmatter + body
// into one posts.json at the repo root that blog.html fetches at runtime.
// Run automatically by .github/workflows/build-posts.yml on every push.

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
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    return {
      slug: slugify(file),
      date: data.date || '',
      tag: data.tag || 'General',
      title: data.title || 'Untitled',
      image: data.image || '',
      excerpt: data.excerpt || '',
      body: content.trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
      gallery: (data.gallery || []).map(g => (typeof g === 'string' ? g : g.src)).filter(Boolean)
    };
  });

  // Newest first. Falls back to filename order if dates don't parse.
  posts.sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    if (isNaN(da) || isNaN(db)) return b.slug.localeCompare(a.slug);
    return db - da;
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`Wrote ${posts.length} post(s) to posts.json`);
}

build();
