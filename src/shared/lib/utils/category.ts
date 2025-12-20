async function generateCategorySlug(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return slug;
}

export { generateCategorySlug };
