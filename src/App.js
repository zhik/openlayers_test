import "./styles.css";

import React, { useState, useEffect, useRef } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import WebGLTile from "ol/layer/WebGLTile"
import { useGeographic } from "ol/proj.js";
import OSM from "ol/source/OSM";
import "ol/ol.css";
import { PMTilesRasterSource } from 'ol-pmtiles'

const tempf_colors = [
  50,
  "#000004",
  60,
  "#210c4a",
  70,
  "#57106e",
  80,
  "#8a226a",
  90,
  "#bc3754",
  100,
  "#e45a31",
  110,
  "#f98e09",
  120,
  "#f9cb35",
  130,
  "#fcffa4"]

const relative_colors = [
  -5,
  '#0571b0',
  -2.5,
  '#92c5de',
  0,
  '#f7f7f7',
  5,
  '#f4a582',
  10,
  '#ca0020',
]

export default function App() {
  const mapElement = useRef()
  const [mapObj, setMapObj] = useState(null)
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null)
  const [pixelValue, setPixelValue] = useState(null)

  const displayPixelValue = event => {
    // does not work, todo fix access to the state
    if (selectedLayer) {
      const data = selectedLayer.getData(event.pixel);
      setPixelValue(data.at(0)?.toFixed(3))
    }
  }

  const handleChange = event => {
    const url = event.target.value
    setSelected(url);
  };

  useEffect(() => {
    if (!selected) return;

    if (selectedLayer) {
      //remove previous layer
      mapObj.removeLayer(selectedLayer)
    }

    const color_palette = selected.includes('Relative') ? relative_colors : tempf_colors
    const pmtile = new WebGLTile({
      style: {
        color: [
          'interpolate',
          ['linear'],
          ['/', ['*', ['band', 1], 255], 1],
          ...color_palette
        ]
      },
      source: new PMTilesRasterSource({
        url: selected,
        attributions: ["USGS LandStat"],
        tileSize: [512, 512]
      })
    });

    mapObj.addLayer(pmtile)
    setSelectedLayer(pmtile);
  }, [selected])

  // https://mxd.codes/articles/how-to-create-a-web-map-with-open-layers-and-react
  useEffect(() => {
    //init map
    const osmLayer = new TileLayer({
      // preload: Infinity,
      source: new OSM(),
    });

    useGeographic();

    const initialMapObj = new Map({
      target: mapElement.current,
      layers: [osmLayer],
      view: new View({
        center: [-73.84200928305255, 40.76043006443475],
        zoom: 12,
      }),
    });

    initialMapObj.on(['click'], displayPixelValue);

    setMapObj(initialMapObj)

    //init layers
    fetch("https://www.urban-heat.duckdns.org/api/pmtiles")
      .then((res) => res.json())
      .then((data) => {
        setLayers(data)
        setSelected(data.at(-1).s3_url) // select a layer at the end
      });
    return () => initialMapObj.setTarget(null);
  }, []);

  return (
    <main>
      <select onChange={handleChange} value={selected}>
        {layers.map((layer) =>
          <option value={layer.s3_url} key={layer.filename}>{layer.filename}</option>)}
      </select>
      <p>Value at clicked point: {pixelValue}</p>
      <div
        style={{ height: "90vh", width: "100%" }}
        ref={mapElement}
        className="map-container"
      />
    </main>
  );
}
