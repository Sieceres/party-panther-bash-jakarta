-- Normalize drink_type values to standard categories
-- Map raw drink names to standardized categories

-- Spirits: whisky, vodka, gin, gin_tonic, soju, rum, tequila, etc.
UPDATE promos SET drink_type = ARRAY(
  SELECT DISTINCT
    CASE 
      WHEN lower(dt) IN ('whisky', 'whiskey', 'vodka', 'gin', 'gin_tonic', 'soju', 'rum', 'tequila', 'bourbon', 'brandy', 'cognac', 'scotch', 'aperol', 'campari', 'jagermeister', 'arak', 'spirits', 'spirit', 'shot', 'shots') THEN 'Spirits'
      WHEN lower(dt) IN ('beer', 'beers', 'bintang', 'heineken', 'carlsberg', 'corona', 'tiger', 'lager', 'ale', 'ipa', 'stout', 'draft', 'draught', 'pint') THEN 'Beer'
      WHEN lower(dt) IN ('cocktail', 'cocktails', 'mojito', 'margarita', 'martini', 'negroni', 'spritz', 'mixed drink', 'mixology') THEN 'Cocktails'
      WHEN lower(dt) IN ('wine', 'wines', 'red wine', 'white wine', 'rosé', 'rose', 'prosecco', 'champagne', 'sparkling', 'sangria') THEN 'Wine'
      WHEN lower(dt) IN ('coffee', 'tea', 'espresso', 'latte', 'matcha') THEN 'Coffee & Tea'
      WHEN lower(dt) IN ('food', 'pizza', 'burger', 'wings', 'nachos', 'fries', 'snack', 'brunch', 'meal', 'bbq', 'steak') THEN 'Food'
      WHEN lower(dt) IN ('drinks', 'drink', 'beverages') THEN 'Drinks'
      ELSE dt  -- keep as-is if unknown
    END
  FROM unnest(drink_type) AS dt
)
WHERE drink_type IS NOT NULL AND array_length(drink_type, 1) > 0;