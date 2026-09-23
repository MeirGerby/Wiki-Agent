# Geographic Coordinates: Latitude and Longitude

## Definition
Latitude and longitude are the two angles of a geographic coordinate system that together pinpoint any position on Earth's surface.

- **Latitude (φ, phi)** measures north–south position: an angle from −90° at the South Pole, through 0° at the Equator, to 90° at the North Pole. Lines of constant latitude are called *parallels* (they run east–west, parallel to the Equator).
- **Longitude (λ, lambda)** measures east–west position: an angle from 0° at the prime meridian to +180° east and −180° west. Lines of constant longitude are called *meridians* (they run pole to pole).

Defined as angles from Earth's centre, they are essentially "spherical latitude/longitude"; mapping uses slightly different *geodetic* definitions tied to a reference ellipsoid (e.g. WGS 84).

## Mental Model
Imagine a sphere wrapped in graph paper:
- Latitude = the horizontal rows, counted north and south from the Equator (a natural zero line, like "Main Street").
- Longitude = the vertical columns, counted east and west from the prime meridian (a *conventional* zero, chosen near Greenwich — there is no natural one).
- One row + one column intersect at exactly one point: any position is where answer to "how far north?" meets "how far east?".

Key asymmetry: every degree of latitude spans roughly the same distance (~111 km), but degrees of longitude squeeze together toward the poles — all meridians meet at the poles, so the distance per degree shrinks from ~111 km at the Equator to zero at the poles.

## Example
```text
# Where is Washington, D.C.? (approx., Britannica-style)
Degree formatting:  39° N  77° W
Decimal degrees:    39,  -77        # latitude, longitude
```

Formatting conventions to know (practical):
- **DMS** ("degrees–minutes–seconds": 38°53′42″N 77°02′12″W) vs **decimal degrees** (38.895, −77.037).
- Many **API models put longitude first**: GeoJSON stores coordinates as `[longitude, latitude]`, while humans usually write "lat, lon". Always check the API's field order.
  *(This API-order remark is general knowledge, not stated in the fetched sources.)*

## Notes & Uncertainties
- Distances per degree (from the Wikipedia "Geographic coordinate system" article): on the WGS 84 / GRS 80 spheroid at sea level at the Equator, one degree of latitude ≈ 110.6 km, one minute ≈ 1843 m, one second ≈ 30.7 m; a degree of longitude at the Equator ≈ 111.3 km (60 geographical miles).
- Time zones are derived from longitude: zones typically span 15° of longitude (general knowledge corroborated by the fetched sources).
- The prime meridian convention: the International Reference Meridian passes near the Royal Observatory in Greenwich, London.

## Related Concepts
- No other geographic topics have wiki pages yet; this page is the starting point for mapping/coordinates material.

## Sources
- [[raw/topics/latitude-longitude.md]]
- [Latitude – Wikipedia](https://en.wikipedia.org/wiki/Latitude)
- [Longitude – Wikipedia](https://en.wikipedia.org/wiki/Longitude)
- [Geographic coordinate system – Wikipedia](https://en.wikipedia.org/wiki/Geographic_coordinate_system)