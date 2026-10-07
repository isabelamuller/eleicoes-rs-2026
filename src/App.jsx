import { useEffect, useMemo, useState } from 'react';

const CARGOS = [
  { label: 'Deputado Estadual', value: 'Deputado Estadual' },
  { label: 'Deputado Federal', value: 'Deputado Federal' },
  { label: 'Senador', value: 'Senador' },
  { label: 'Governador', value: 'Governador' },
  { label: 'Presidente', value: 'Presidente' },
];

const CARGO_SLUGS = {
  'Deputado Estadual': 'deputado-estadual',
  'Deputado Federal': 'deputado-federal',
  Senador: 'senador',
  Governador: 'governador',
  Presidente: 'presidente',
};

const ALL_CITIES = '__ALL__';

function App() {
  const [data, setData] = useState({});
  const [cidade, setCidade] = useState(ALL_CITIES);
  const [cargo, setCargo] = useState('Deputado Estadual');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/votos_eleicoes.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar os dados.');
        }

        return response.json();
      })
      .then((json) => {
        setData(json.data ?? json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const cidades = useMemo(() => {
    return Object.keys(data)
      .filter((key) => key !== 'votos')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [data]);

  const isAll = cidade === ALL_CITIES;

  const dadosCidade = !isAll ? data[cidade] : null;
  const dadosCargo = dadosCidade?.[cargo];

  const candidatos = dadosCidade?.votos?.[CARGO_SLUGS[cargo]] || [];

  const totalVotos = candidatos.reduce(
    (total, candidato) =>
      total + Number(candidato.qtdVotos || 0),
    0
  );

  const dadosTodosEstado = useMemo(() => {
    return cidades.reduce(
      (totais, nomeCidade) => {
        const cidadeData = data[nomeCidade];
        const cargoData = cidadeData?.[cargo];

        return {
          brancos:
            totais.brancos + Number(cargoData?.brancos || 0),
          nulos:
            totais.nulos + Number(cargoData?.nulos || 0),
        };
      },
      {
        brancos: 0,
        nulos: 0,
      }
    );
  }, [data, cidades, cargo]);

  if (loading) {
    return (
      <main className="app">
        <div className="container">
          <div className="loading">
            <span>Carregando dados...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app">
        <div className="container">
          <div className="error">
            <h2>Não foi possível carregar os dados</h2>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="container">
        <header className="hero">

          <h1>Como o Rio Grande do Sul votou?</h1>

        </header>

        <section className="filters">
          <label>
            <span>Cidade</span>

            <select
              value={cidade}
              onChange={(event) =>
                setCidade(event.target.value)
              }
            >
              <option value={ALL_CITIES}>
                Todo o Rio Grande do Sul
              </option>

              {cidades.map((nomeCidade) => (
                <option
                  key={nomeCidade}
                  value={nomeCidade}
                >
                  {nomeCidade}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cargo</span>

            <select
              value={cargo}
              onChange={(event) =>
                setCargo(event.target.value)
              }
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
        </section>

        <section className="results">
          <div className="results-header">
              <h2>
                {isAll ? 'Votos nulos/brancos em todo o estado' : `Votos nulos/brancos em ${cidade}`}
              </h2>

            <span className="cargo-badge">
              {cargo}
            </span>
          </div>

          {isAll ? (
            <>
              <div className="summary-grid">
                <article className="summary-card">
                  <span>Votos brancos no RS</span>

                  <strong>
                    {formatNumber(
                      dadosTodosEstado.brancos
                    )}
                  </strong>
                </article>

                <article className="summary-card">
                  <span>Votos nulos no RS</span>

                  <strong>
                    {formatNumber(
                      dadosTodosEstado.nulos
                    )}
                  </strong>
                </article>

                <article className="summary-card summary-card-total">
                  <span>Brancos + nulos</span>

                  <strong>
                    {formatNumber(
                      dadosTodosEstado.brancos +
                        dadosTodosEstado.nulos
                    )}
                  </strong>
                </article>
              </div>
              
            </>
          ) : (
            <>
              <div className="summary-grid">
                <article className="summary-card">
                  <span>Votos brancos</span>

                  <strong>
                    {formatNumber(
                      dadosCargo?.brancos
                    )}
                  </strong>
                </article>

                <article className="summary-card">
                  <span>Votos nulos</span>

                  <strong>
                    {formatNumber(
                      dadosCargo?.nulos
                    )}
                  </strong>
                </article>

                <article className="summary-card">
                  <span>Votos em candidatos</span>

                  <strong>
                    {formatNumber(totalVotos)}
                  </strong>
                </article>
              </div>

              <div className="candidates">
                <div className="section-heading">
                    <h3>Candidatos</h3>
                  <span>
                    {candidatos.length}{' '}
                    {candidatos.length === 1
                      ? 'candidato'
                      : 'candidatos'}
                  </span>
                </div>

                {candidatos.length === 0 ? (
                  <div className="empty-state">
                    <p>
                      Não há votos nominais para este cargo.
                    </p>
                  </div>
                ) : (
                  <div className="candidate-list">
                    {candidatos.map(
                      (candidato, index) => {
                        const votos = Number(
                          candidato.qtdVotos || 0
                        );

                        const percentual =
                          totalVotos > 0
                            ? (votos / totalVotos) * 100
                            : 0;

                        return (
                          <article
                            className="candidate"
                            key={`${candidato.nome}-${candidato.partido}-${index}`}
                          >
                            <div className="candidate-top">
                              <div className="candidate-info">
                                <span className="position">
                                  {String(index + 1).padStart(
                                    2,
                                    '0'
                                  )}
                                </span>

                                <div>
                                  <h4>
                                    {candidato.nome}
                                  </h4>

                                  <span>
                                    {candidato.partido ||
                                      'Sem partido'}
                                  </span>
                                </div>
                              </div>

                              <strong>
                                {formatNumber(votos)}
                              </strong>
                            </div>

                            <div className="bar">
                              <div
                                className="bar-fill"
                                style={{
                                  width: `${percentual}%`,
                                }}
                              />
                            </div>

                            <span className="percentage">
                              {percentual.toFixed(1)}%
                            </span>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </main>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export default App;