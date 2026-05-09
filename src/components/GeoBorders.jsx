import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function GeoBorders({ radius = 2.01 }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  const linesGeometry = useMemo(() => {
    if (!geoData) return null;
    const points = [];
    
    const addPolygon = (coords) => {
      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];

        const phi1 = (90 - lat1) * (Math.PI / 180);
        const theta1 = (lon1 + 90) * (Math.PI / 180);
        
        const x1 = radius * Math.sin(phi1) * Math.cos(theta1);
        const y1 = radius * Math.cos(phi1);
        const z1 = radius * Math.sin(phi1) * Math.sin(theta1);

        const phi2 = (90 - lat2) * (Math.PI / 180);
        const theta2 = (lon2 + 90) * (Math.PI / 180);

        const x2 = radius * Math.sin(phi2) * Math.cos(theta2);
        const y2 = radius * Math.cos(phi2);
        const z2 = radius * Math.sin(phi2) * Math.sin(theta2);

        points.push(new THREE.Vector3(x1, y1, z1));
        points.push(new THREE.Vector3(x2, y2, z2));
      }
    };

    geoData.features.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach(addPolygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon) => {
          polygon.forEach(addPolygon);
        });
      }
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [geoData, radius]);

  if (!linesGeometry) return null;

  return (
    <lineSegments geometry={linesGeometry}>
      <lineBasicMaterial color="#0A6ED3" transparent opacity={0.8} depthWrite={false} />
    </lineSegments>
  );
}
