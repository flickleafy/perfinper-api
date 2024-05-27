export function categoryNameToId(categoryName, categories) {
  if (categoryName && categories.length) {
    const selectedCategory = categories.filter(
      (category) => category.name === categoryName
    )[0];
    return selectedCategory.id;
  }
}
