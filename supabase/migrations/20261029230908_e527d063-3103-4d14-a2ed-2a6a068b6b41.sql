-- Run with the migration tool. Fixtures live inside an exception subtransaction
-- and are always rolled back; existing content is not repaired by these tests.
DO $$
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
 p uuid := gen_random_uuid(); owner_id uuid; actual uuid; denied boolean := false;
BEGIN
 SELECT created_by INTO owner_id FROM public.promos LIMIT 1;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Tests require an existing promo owner'; END IF;
 IF public.venue_link_match_key('Blue Grass') <> public.venue_link_match_key('BLUEGRASS') THEN
  RAISE EXCEPTION 'Space and case normalization failed';
 END IF;
 IF public.venue_link_match_key('Blue-Grass!') <> 'bluegrass' THEN
  RAISE EXCEPTION 'Punctuation normalization failed';
 END IF;
 BEGIN
  INSERT INTO public.venues(id,name) VALUES(a, 'PP Link Test ' || a::text);
  INSERT INTO public.promos(id,title,description,discount_text,venue_name,created_by)
   VALUES(p,'Link test','Test','Test','PPLinkTest' || a::text,owner_id);
  SELECT venue_id INTO actual FROM public.promos WHERE id=p;
  IF actual IS DISTINCT FROM a THEN RAISE EXCEPTION 'Unique spaced name did not auto-link'; END IF;

  INSERT INTO public.venues(id,name) VALUES(b, 'PP Separate ' || b::text);
  UPDATE public.promos SET venue_name='PP Separate ' || b::text WHERE id=p;
  SELECT venue_id INTO actual FROM public.promos WHERE id=p;
  IF actual IS DISTINCT FROM a THEN RAISE EXCEPTION 'A valid link was overwritten'; END IF;

  UPDATE public.venues SET name='PPLinkTest' || a::text WHERE id=b;
  UPDATE public.promos SET venue_id=NULL,venue_name='PP Link Test ' || a::text WHERE id=p;
  SELECT venue_id INTO actual FROM public.promos WHERE id=p;
  IF actual IS NOT NULL THEN RAISE EXCEPTION 'Ambiguous match was automatically linked'; END IF;

  UPDATE public.promos SET venue_name='PP Future ' || c::text WHERE id=p;
  INSERT INTO public.venues(id,name) VALUES(c,'PPFuture' || c::text);
  SELECT venue_id INTO actual FROM public.promos WHERE id=p;
  IF actual IS DISTINCT FROM c THEN RAISE EXCEPTION 'New venue did not link an existing promo'; END IF;

  PERFORM set_config('request.jwt.claim.sub','',true);
  BEGIN
   PERFORM public.apply_promo_venue_repairs('[]'::jsonb);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Signed-out repair was allowed'; END IF;
  RAISE EXCEPTION USING ERRCODE='Z0001', MESSAGE='Rollback successful test fixtures';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
END $$;