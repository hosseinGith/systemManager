let apiService = "service.aff541c3fa1f4f8889be0b5af1cb7e9d";
let apiWeb = "web.d339306ef58046dfa7b5e19dc6def9cb";
let inputClicked = {};
let vectorLayer;

async function mapClickHand(e) {
  let [x, y] = ol.proj.toLonLat(e.coordinate);
  let marker = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y])),
  });
  // add Marker to the map
  neshanMap.removeLayer(vectorLayer);

  let vectorSource = new ol.source.Vector({
    features: [marker],
  });

  vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  neshanMap.addLayer(vectorLayer);
  let res = await (
    await fetch(`https://api.neshan.org/v5/reverse?lat=${y}&lng=${x}`, {
      headers: {
        "Api-Key": apiService,
      },
    })
  ).json();
  marker.setStyle(
    new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        scale: 0.5,
        src: "assets/image/marker-icon-2x-red.png",
      }),
    })
  );
  document.querySelector(".window").classList.remove("active");
  if (!inputClicked) return;
  inputClicked.value = res.formatted_address;
  inputClicked = false;
}
async function searchResult(input) {
  let res = await (
    await fetch(`https://api.neshan.org/v6/geocoding?address=${input}`, {
      headers: {
        "Api-Key": apiService,
      },
    })
  ).json();
  if (!res.location) return false;
  $("#map").empty();
  neshanMap = null;
  neshanMap = new ol.Map({
    target: "map",
    key: apiWeb, // Get your own API Key on https://platform.neshan.org/panel
    maptype: "neshan",
    poi: false,
    traffic: false,
    view: new ol.View({
      center: ol.proj.fromLonLat([res.location.x, res.location.y]),
      zoom: 14,
    }),
  });
  neshanMap.removeLayer(vectorLayer);

  let marker = new ol.Feature({
    geometry: new ol.geom.Point(
      ol.proj.fromLonLat([res.location.x, res.location.y])
    ),
  });
  marker.setStyle(
    new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        scale: 0.5,
        src: "assets/image/marker-icon-2x-red.png",
      }),
    })
  );

  let vectorSource = new ol.source.Vector({
    features: [marker],
  });

  vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  neshanMap.addLayer(vectorLayer);
  neshanMap.on("click", mapClickHand);
  return true;
}
async function openLayer() {
  $("#map").empty();
  let pos = [48.27414575152297, 30.39118049594397];
  let search = false;
  if (inputClicked.value) {
    search = await searchResult(inputClicked.value);
  }
  if (!search)
    neshanMap = new ol.Map({
      target: "map",
      key: apiWeb,
      maptype: "neshan",
      poi: false,
      traffic: false,
      view: new ol.View({
        center: ol.proj.fromLonLat(pos),
        zoom: 14,
      }),
    });
  neshanMap.on("click", mapClickHand);
}
let inputsOnclickShowLocation = document.querySelectorAll(
  ".inputsOnclickShowLocation"
);
inputsOnclickShowLocation.forEach((item) => {
  item.addEventListener("dblclick", (e) => {
    document.querySelector(".window").classList.add("active");
    inputClicked = item;
    openLayer();
  });
});
