import stringsJson from './strings.json';

export type AppStrings = typeof stringsJson;
export const STRINGS: AppStrings = stringsJson;
export default STRINGS;
