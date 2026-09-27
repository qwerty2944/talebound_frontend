/** Build runtime labels from the reviewed artwork names without changing Unity indices. */
import fs from 'node:fs';
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const all = read('public/data/sprites/all-sprites.json');
const categories = ['body', 'eye', 'hair', 'facehair', 'helmet', 'armor', 'cloth', 'pant', 'back', 'sword', 'axe', 'bow', 'spear', 'wand', 'dagger', 'shield'];
const catalog: Record<string, { sprite: string; name: string }[]> = {};
for (const category of categories) {
  const appearance = ['body', 'eye', 'hair', 'facehair'].includes(category);
  const source = read(appearance ? `public/data/sprites/appearance/${category}.json` : `scripts/naming/${category}.json`);
  const rows = appearance ? source[({body:'bodies',eye:'eyes',hair:'hairs',facehair:'facehairs'} as Record<string,string>)[category]] : source.sprites;
  catalog[category] = all[`${category}Names`].map((sprite: string) => {
    const row = rows.find((row: {sprite: string}) => row.sprite.trim() === sprite.trim());
    const name = row?.[appearance ? 'ko' : 'nameKo'];
    if (!name || name === sprite) throw new Error(`Missing display name: ${category}/${sprite}`);
    return { sprite, name };
  });
}
fs.writeFileSync('src/shared/lib/character/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(`Generated ${Object.values(catalog).flat().length} named character parts`);
