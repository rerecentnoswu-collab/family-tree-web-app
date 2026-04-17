-- Step 3: Get the actual person IDs for Centino family
SELECT 
  id,
  first_name,
  last_name,
  birthday,
  CASE 
    WHEN user_id = '88ffaf9c-1000-4be2-8415-d1c924d8bf9f' THEN 'rere.centno.swu@phinmaed.com'
    WHEN user_id = 'aea0c215-1e22-45fe-aa64-15e2d9604020' THEN 'kensite24@gmail.com'
    ELSE 'No Account'
  END as account,
  CASE 
    WHEN birthday IS NOT NULL THEN (2024 - EXTRACT(YEAR FROM birthday::date))::text || ' years old'
    ELSE 'unknown age'
  END as age
FROM persons 
WHERE last_name = 'Centino' 
ORDER BY 
  CASE 
    WHEN first_name = 'Celestino' AND birthday = '1950-09-01' THEN 1
    WHEN first_name = 'Andressa' AND birthday = '1956-11-30' THEN 2
    WHEN first_name = 'Reycel' AND birthday = '1980-02-28' THEN 3
    WHEN first_name = 'John Marc' AND birthday = '1997-09-21' THEN 4
    ELSE 5
  END,
  birthday DESC;
