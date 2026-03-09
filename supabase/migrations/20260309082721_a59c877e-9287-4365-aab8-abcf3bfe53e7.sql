-- Clean up remaining non-standard drink_type values
UPDATE promos SET drink_type = ARRAY(
  SELECT DISTINCT
    CASE 
      WHEN lower(dt) IN ('gin and tonic', 'gin tonic', 'vodka sprite', 'whisky ginger ale', 'highball', 'mocktails') THEN 'Cocktails'
      WHEN lower(dt) IN ('anggur merah', 'port', 'sparkling wine') THEN 'Wine'
      WHEN lower(dt) IN ('other_liquor') THEN 'Spirits'
      WHEN lower(dt) IN ('all drinks') THEN 'Drinks'
      ELSE dt
    END
  FROM unnest(drink_type) AS dt
)
WHERE drink_type IS NOT NULL AND array_length(drink_type, 1) > 0;