window.onload = function () {
  const defaultCoords = [77.2090, 28.6139];

  const listingCoords = [coords.lon,coords.lat];


       
  const isValidCoords = Array.isArray(listingCoords) && listingCoords.length === 2;
  const map = tt.map({
   
    key: TOM_API_KEY,
    container: "map",
    center: isValidCoords ? listingCoords : defaultCoords,
    zoom: 11,
  });

  if (isValidCoords) {
    new tt.Marker().setLngLat(listingCoords)
    .setPopup(new tt.Popup({offset: 25})
    .setHTML(`<h4>${ListingLocation}</h4><p>Exact Location provided after booking!</p>`))
    .addTo(map);
  } else {
    console.warn("Invalid or missing coordinates. Showing default location.");
  }
}; 