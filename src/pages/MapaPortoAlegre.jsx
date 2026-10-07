import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import AreaSwitch from '../AreaSwitch.jsx';

import './MapaPortoAlegre.css';

const CARGOS = [
  {
    label: 'Deputado Estadual',
    value: 'deputado-estadual',
  },
  {
    label: 'Deputado Federal',
    value: 'deputado-federal',
  },
  {
    label: 'Senador',
    value: 'senador',
  },
  {
    label: 'Governador',
    value: 'governador',
  },
  {
    label: 'Presidente',
    value: 'presidente',
  },
];

function normalizeName(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function getFeatureName(feature) {
  const properties = feature?.properties || {};

  return (
    properties.NM_BAIRRO ||
    properties.NOME_BAIRRO ||
    properties.bairro ||
    properties.Bairro ||
    properties.NOME ||
    properties.nome ||
    properties.NAME ||
    properties.name ||
    ''
  );
}

function getPolygons(geometry) {
  if (geometry?.type === 'Polygon') {
    return [geometry.coordinates];
  }

  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates;
  }

  return [];
}

function getBounds(features) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const feature of features) {
    for (const polygon of getPolygons(feature.geometry)) {
      for (const ring of polygon) {
        for (const [longitude, latitude] of ring) {
          minX = Math.min(minX, longitude);
          minY = Math.min(minY, latitude);
          maxX = Math.max(maxX, longitude);
          maxY = Math.max(maxY, latitude);
        }
      }
    }
  }

  if (!Number.isFinite(minX)) {
    return [
      [-51.3, -30.2],
      [-51.0, -29.9],
    ];
  }

  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

function projectPoint(
  [longitude, latitude],
  bounds,
  width,
  height,
) {
  const [[minX, minY], [maxX, maxY]] = bounds;

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  const padding = 35;

  const x =
    padding +
    ((longitude - minX) / xRange) *
      (width - padding * 2);

  const y =
    height -
    padding -
    ((latitude - minY) / yRange) *
      (height - padding * 2);

  return [x, y];
}

function distanceToSegmentSquared(point, start, end) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];

  if (deltaX === 0 && deltaY === 0) {
    const offsetX = point[0] - start[0];
    const offsetY = point[1] - start[1];

    return offsetX * offsetX + offsetY * offsetY;
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * deltaX +
        (point[1] - start[1]) * deltaY) /
        (deltaX * deltaX + deltaY * deltaY),
    ),
  );

  const offsetX =
    point[0] - (start[0] + projection * deltaX);

  const offsetY =
    point[1] - (start[1] + projection * deltaY);

  return offsetX * offsetX + offsetY * offsetY;
}

function simplifyOpenLine(points, toleranceSquared) {
  if (points.length <= 2) {
    return points;
  }

  const keep = new Uint8Array(points.length);

  const stack = [[0, points.length - 1]];

  keep[0] = 1;
  keep[points.length - 1] = 1;

  while (stack.length) {
    const [startIndex, endIndex] = stack.pop();

    let farthestIndex = -1;
    let farthestDistance = toleranceSquared;

    for (
      let index = startIndex + 1;
      index < endIndex;
      index += 1
    ) {
      const distance = distanceToSegmentSquared(
        points[index],
        points[startIndex],
        points[endIndex],
      );

      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }

    if (farthestIndex !== -1) {
      keep[farthestIndex] = 1;

      stack.push(
        [startIndex, farthestIndex],
        [farthestIndex, endIndex],
      );
    }
  }

  return points.filter((_, index) => keep[index]);
}

function simplifyRing(
  ring,
  bounds,
  width,
  height,
) {
  const projected = ring.map((point) =>
    projectPoint(point, bounds, width, height),
  );

  if (
    projected.length > 1 &&
    projected[0][0] === projected.at(-1)[0] &&
    projected[0][1] === projected.at(-1)[1]
  ) {
    projected.pop();
  }

  if (projected.length <= 4) {
    return projected;
  }

  let splitIndex = 1;
  let farthestDistance = 0;

  for (
    let index = 1;
    index < projected.length;
    index += 1
  ) {
    const distance = distanceToSegmentSquared(
      projected[index],
      projected[0],
      projected[0],
    );

    if (distance > farthestDistance) {
      farthestDistance = distance;
      splitIndex = index;
    }
  }

  const firstArc = simplifyOpenLine(
    projected.slice(0, splitIndex + 1),
    0.75 ** 2,
  );

  const secondArc = simplifyOpenLine(
    [...projected.slice(splitIndex), projected[0]],
    0.75 ** 2,
  );

  return [
    ...firstArc.slice(0, -1),
    ...secondArc,
  ];
}

function createPath(
  geometry,
  bounds,
  width,
  height,
) {
  return getPolygons(geometry)
    .flatMap((polygon) =>
      polygon.map((ring) =>
        simplifyRing(
          ring,
          bounds,
          width,
          height,
        )
          .map(
            ([x, y], index) =>
              `${index === 0 ? 'M' : 'L'} ${x} ${y}`,
          )
          .join(' ') + ' Z',
      ),
    )
    .join(' ');
}

function getValue(
  votesByNeighborhood,
  normalizedBairro,
  cargo,
) {
  const neighborhood =
    votesByNeighborhood.get(normalizedBairro);

  return {
    brancos: Number(
      neighborhood?.brancos?.[cargo] || 0,
    ),
    nulos: Number(
      neighborhood?.nulos?.[cargo] || 0,
    ),
  };
}

function getTopCandidates(candidates, count) {
  const topCandidates = [];

  for (const candidate of candidates || []) {
    const candidateVotes = Number(
      candidate.qtdVotos || 0,
    );

    const index = topCandidates.findIndex(
      (topCandidate) =>
        candidateVotes >
        Number(topCandidate.qtdVotos || 0),
    );

    if (index !== -1) {
      topCandidates.splice(index, 0, candidate);
    } else if (topCandidates.length < count) {
      topCandidates.push(candidate);
    } else {
      continue;
    }

    if (topCandidates.length > count) {
      topCandidates.pop();
    }
  }

  return topCandidates;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

const MapNeighborhood = memo(
  function MapNeighborhood({
    name,
    path,
    values,
    intensity,
    isHovered,
    onHover,
  }) {
    return (
      <path
        d={path}
        className={`map-neighborhood ${
          isHovered ? 'is-hovered' : ''
        }`}
        style={{
          '--intensity': intensity,
        }}
        onMouseEnter={() =>
          onHover(name, values)
        }
      />
    );
  },
);

function App() {
  const [geoData, setGeoData] = useState(null);
  const [votesData, setVotesData] = useState({});
  const [cargo, setCargo] = useState(
    'deputado-estadual',
  );
  const [hoveredBairro, setHoveredBairro] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const WIDTH = 900;
  const HEIGHT = 700;

  useEffect(() => {
    Promise.all([
      fetch('/porto-alegre-bairros.geojson').then(
        async (response) => {
          if (!response.ok) {
            throw new Error(
              'Não foi possível carregar o mapa.',
            );
          }

          return response.json();
        },
      ),

      fetch('/api/porto-alegre-map').then(
        async (response) => {
          if (response.status === 401) {
            throw new Error(
              'Sua sessão expirou. Entre novamente.',
            );
          }

          if (!response.ok) {
            throw new Error(
              'Não foi possível carregar os votos.',
            );
          }

          return response.json();
        },
      ),
    ])
      .then(([geoJson, votes]) => {
        setGeoData(geoJson);
        setVotesData(votes.data ?? votes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const features = geoData?.features || [];

  const bounds = useMemo(
    () => getBounds(features),
    [features],
  );

  const votesByNeighborhood = useMemo(
    () =>
      new Map(
        Object.entries(votesData).map(
          ([name, neighborhood]) => [
            normalizeName(name),
            neighborhood,
          ],
        ),
      ),
    [votesData],
  );

  const mapFeatures = useMemo(
    () =>
      features.map((feature) => {
        const name = getFeatureName(feature);

        return {
          name,
          path: createPath(
            feature.geometry,
            bounds,
            WIDTH,
            HEIGHT,
          ),
        };
      }),
    [features, bounds],
  );

  const mapNeighborhoods = useMemo(() => {
    const maxValue = Math.max(
      1,
      ...Array.from(
        votesByNeighborhood.values(),
        (neighborhood) =>
          Number(
            neighborhood.brancos?.[cargo] || 0,
          ) +
          Number(
            neighborhood.nulos?.[cargo] || 0,
          ),
      ),
    );

    return mapFeatures.map(({ name, path }) => {
      const normalizedName =
        normalizeName(name);

      const values = getValue(
        votesByNeighborhood,
        normalizedName,
        cargo,
      );

      return {
        name,
        path,
        values,
        intensity:
          (values.brancos + values.nulos) /
          maxValue,
      };
    });
  }, [
    mapFeatures,
    votesByNeighborhood,
    cargo,
  ]);

  const topCandidatesByNeighborhood =
    useMemo(
      () =>
        new Map(
          Array.from(
            votesByNeighborhood,
            ([name, neighborhood]) => [
              name,
              new Map(
                CARGOS.map(({ value }) => [
                  value,
                  getTopCandidates(
                    neighborhood.votos?.[value],
                    3,
                  ),
                ]),
              ),
            ],
          ),
        ),
      [votesByNeighborhood],
    );

  const totals = useMemo(() => {
    let brancos = 0;
    let nulos = 0;

    for (const neighborhood of votesByNeighborhood.values()) {
      brancos += Number(
        neighborhood.brancos?.[cargo] || 0,
      );

      nulos += Number(
        neighborhood.nulos?.[cargo] || 0,
      );
    }

    return {
      brancos,
      nulos,
    };
  }, [votesByNeighborhood, cargo]);

  const handleNeighborhoodHover = useCallback(
    (name, values) => {
      setHoveredBairro({
        name,
        ...values,
      });
    },
    [],
  );

  if (loading) {
    return (
      <main className="map-page">
        <div className="map-container">
          <p className="map-loading">
            Carregando mapa...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="map-page">
        <div className="map-container">
          <div className="map-error">
            <h1>Erro ao carregar o mapa</h1>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const cargoLabel =
    CARGOS.find(
      (item) => item.value === cargo,
    )?.label || cargo;

  const hoveredCandidates =
    topCandidatesByNeighborhood
      .get(normalizeName(hoveredBairro?.name || ''))
      ?.get(cargo) || [];

  return (
    <main className="map-page">
      <div className="map-container">
        <AreaSwitch active="poa" />

        <header className="map-header">
          <div>
            <p className="eyebrow">
              Porto Alegre · Eleições 2026
            </p>

            <h1>Como Porto Alegre votou?</h1>

            <p>
              Passe o mouse pelos bairros para
              ver os votos brancos e nulos.
            </p>
          </div>

          <label className="map-select">
            <span>Cargo</span>

            <select
              value={cargo}
              onChange={(event) => {
                setCargo(event.target.value);
                setHoveredBairro(null);
              }}
            >
              {CARGOS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </header>

        <section className="map-wrapper">
          <div className="map-title">
            <div>
              <p className="eyebrow">Resultado</p>

              <h2>Porto Alegre</h2>
            </div>

            {hoveredBairro && (
              <div className="map-tooltip">
                <strong>
                  {hoveredBairro.name}
                </strong>

                <span className="map-tooltip-cargo">
                  {cargoLabel}
                </span>

                <div>
                  <span>Brancos</span>

                  <strong>
                    {formatNumber(
                      hoveredBairro.brancos,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Nulos</span>

                  <strong>
                    {formatNumber(
                      hoveredBairro.nulos,
                    )}
                  </strong>
                </div>

                <section
                  aria-label={`Três candidatos mais votados para ${cargoLabel}`}
                  className="map-tooltip-highlights"
                >
                  <span className="map-tooltip-office">
                    3 mais votados
                  </span>

                  {hoveredCandidates.map(
                    (candidate, index) => (
                      <div
                        className="map-tooltip-candidate"
                        key={`${candidate.nome}-${index}`}
                      >
                        <span className="map-tooltip-rank">
                          {index + 1}º
                        </span>

                        <strong>
                          {candidate.nome}
                        </strong>

                        <span className="map-tooltip-party">
                          {candidate.partido ||
                            'Sem partido'}
                        </span>

                        <span className="map-tooltip-votes">
                          {formatNumber(
                            candidate.qtdVotos,
                          )}{' '}
                          votos
                        </span>
                      </div>
                    ),
                  )}
                </section>
              </div>
            )}
          </div>

          <div className="map-summary">
            <div>
              <span>Votos brancos</span>

              <strong>
                {formatNumber(totals.brancos)}
              </strong>
            </div>

            <div>
              <span>Votos nulos</span>

              <strong>
                {formatNumber(totals.nulos)}
              </strong>
            </div>

            <div>
              <span>Brancos + nulos</span>

              <strong>
                {formatNumber(
                  totals.brancos +
                    totals.nulos,
                )}
              </strong>
            </div>
          </div>

          <div className="svg-map">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Mapa dos bairros de Porto Alegre"
            >
              {mapNeighborhoods.map(
                (neighborhood) => (
                  <MapNeighborhood
                    key={neighborhood.name}
                    {...neighborhood}
                    isHovered={
                      hoveredBairro?.name ===
                      neighborhood.name
                    }
                    onHover={
                      handleNeighborhoodHover
                    }
                  />
                ),
              )}
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;