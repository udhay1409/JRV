export async function generateUniquePreferenceId() {
  const date = new Date();
  const year = date.getFullYear();
  return `ISH${year}0001`;
}
