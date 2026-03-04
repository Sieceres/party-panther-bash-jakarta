// Maps brand names and drink keywords to drink categories
const DRINK_CATEGORY_MAP: Record<string, string[]> = {
  beer: [
    "heineken", "bintang", "carlsberg", "budweiser", "corona", "stella artois",
    "guinness", "tiger", "asahi", "sapporo", "kirin", "chang", "singha",
    "peroni", "hoegaarden", "leffe", "erdinger", "paulaner", "weihenstephaner",
    "pilsner", "lager", "ale", "ipa", "stout", "porter", "wheat beer",
    "craft beer", "draft beer", "draught", "pint", "beer",
  ],
  spirits: [
    "vodka", "gin", "rum", "tequila", "whiskey", "whisky", "bourbon",
    "brandy", "cognac", "scotch", "mezcal", "absinthe", "grappa",
    "absolut", "smirnoff", "grey goose", "belvedere", "ketel one",
    "tanqueray", "hendricks", "bombay", "beefeater", "gordons",
    "bacardi", "captain morgan", "havana club", "malibu",
    "patron", "jose cuervo", "don julio", "herradura",
    "jack daniels", "johnnie walker", "jameson", "chivas", "glenfiddich",
    "macallan", "hennessy", "remy martin", "courvoisier",
    "jagermeister", "fireball", "kahlua", "baileys", "amaretto",
    "sambuca", "limoncello", "aperol", "campari",
    "spirit", "spirits", "shot", "shots", "neat", "on the rocks",
  ],
  wine: [
    "wine", "red wine", "white wine", "rosé", "rose", "prosecco",
    "champagne", "sparkling wine", "pinot", "cabernet", "merlot",
    "chardonnay", "sauvignon", "riesling", "malbec", "shiraz", "syrah",
    "moscato", "sangria", "cava", "brut",
  ],
  cocktail: [
    "cocktail", "cocktails", "mojito", "margarita", "martini",
    "cosmopolitan", "daiquiri", "old fashioned", "negroni", "spritz",
    "aperol spritz", "pina colada", "long island", "manhattan",
    "moscow mule", "caipirinha", "sangria", "bellini", "mimosa",
    "sour", "highball", "collins", "fizz", "smash", "punch",
    "mixed drink", "mixology",
  ],
  coffee: [
    "coffee", "espresso", "latte", "cappuccino", "americano",
    "macchiato", "mocha", "cold brew", "flat white", "affogato",
    "tea", "matcha", "chai",
  ],
  food: [
    "food", "pizza", "burger", "pasta", "sushi", "wings",
    "nachos", "tacos", "fries", "appetizer", "snack", "platter",
    "brunch", "lunch", "dinner", "meal", "buffet", "bbq",
    "steak", "seafood", "dessert",
  ],
};

export type DrinkCategory = "beer" | "spirits" | "wine" | "cocktail" | "coffee" | "food" | "drink";

export const PLACEHOLDER_IMAGES: Record<DrinkCategory, string> = {
  beer: "/placeholders/beer.jpg",
  spirits: "/placeholders/spirits.jpg",
  wine: "/placeholders/wine.jpg",
  cocktail: "/placeholders/cocktail.jpg",
  coffee: "/placeholders/coffee.jpg",
  food: "/placeholders/food.jpg",
  drink: "/placeholders/drink.jpg",
};

/**
 * Detect the drink category from title, description, discount_text, and drink_type fields.
 */
export function detectDrinkCategory(
  title: string,
  description: string,
  discountText: string,
  drinkTypes: string[]
): DrinkCategory {
  const searchText = [title, description, discountText, ...drinkTypes]
    .join(" ")
    .toLowerCase();

  // Check each category - order matters (more specific first)
  for (const category of ["beer", "spirits", "wine", "cocktail", "coffee", "food"] as const) {
    const keywords = DRINK_CATEGORY_MAP[category];
    if (keywords.some((kw) => searchText.includes(kw))) {
      return category;
    }
  }

  return "drink";
}

/**
 * Get placeholder image URL for a drink category.
 */
export function getPlaceholderImage(category: DrinkCategory): string {
  return PLACEHOLDER_IMAGES[category];
}

/**
 * Enrich drink_type array based on detected category keywords.
 */
export function enrichDrinkTypes(
  existingTypes: string[],
  detectedCategory: DrinkCategory
): string[] {
  if (existingTypes.length > 0) return existingTypes;
  
  const categoryLabel: Record<DrinkCategory, string> = {
    beer: "Beer",
    spirits: "Spirits",
    wine: "Wine",
    cocktail: "Cocktails",
    coffee: "Coffee & Tea",
    food: "Food",
    drink: "Drinks",
  };
  
  return [categoryLabel[detectedCategory]];
}
