CREATE OR REPLACE FUNCTION common_offer_distance(
    offer_id BIGINT,
    user_lat FLOAT,
    user_lon FLOAT
)
RETURNS FLOAT AS $$
DECLARE
    distance FLOAT;
BEGIN
    SELECT ST_Distance(
        coordinates,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::GEOGRAPHY
    ) INTO distance
    FROM common_offers
    WHERE id = offer_id;
    
    RETURN distance;
END;
$$ LANGUAGE plpgsql STABLE;
