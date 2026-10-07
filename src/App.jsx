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
          throw new Error('Não foi possível carregar o arquivo JSON.');
        }

        return response.json();
      })
      .then((json) => {
        const normalizedData = json.data ?? json;

        setData(normalizedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError(error.message);
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

  const candidatos =
    !isAll
      ? dadosCidade?.votos?.[CARGO_SLUGS[cargo]] || []
      : [];

  const totalVotos = candidatos.reduce(
    (total, candidato) => total + Number(candidato.qtdVotos || 0),
    0
  );

  const dadosTodosEstado = useMemo(() => {
    if (!isAll) {
      return {
        brancos: 0,
        nulos: 0,
      };
    }

    return cidades.reduce(
      (totais, nomeCidade) => {
        const cidadeData = data[nomeCidade];
        const cargoData = cidadeData?.[cargo];

        return {
          brancos: totais.brancos + Number(cargoData?.brancos || 0),
          nulos: totais.nulos + Number(cargoData?.nulos || 0),
        };
      },
      {
        brancos: 0,
        nulos: 0,
      }
    );
  }, [data, cidades, cargo, isAll]);

  if (loading) {
    return (
      <main className="app">
        <div className="container">
          <div className="empty-state">
            <p>Carregando dados...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app">
        <div className="container">
          <div className="empty-state">
            <h2>Erro ao carregar os dados</h2>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app">
      <div className="container">
        <header className="header">

          <h1>Votos por cidade</h1>

        </header>

        <section className="filters">
          <label>
            <span>Cidade</span>

            <select
              id={cidade}
              value={cidade}
              onChange={(event) => setCidade(event.target.value)}
            >
              <option value={ALL_CITIES}>
                Todo o Rio Grande do Sul
              </option>

              {cidades.map((nomeCidade) => (
                <option key={nomeCidade} value={nomeCidade}>
                  {nomeCidade}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cargo</span>

            <select
              value={cargo}
              onChange={(event) => setCargo(event.target.value)}
            >
              {CARGOS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="results">
          <div className="results-header">
            <div>
              <h2>
                {isAll ? 'Rio Grande do Sul' : cidade}
              </h2>
            </div>

            <span className="cargo-badge">
              {cargo}
            </span>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <span>Votos brancos</span>

              <strong>
                {formatNumber(
                  isAll
                    ? dadosTodosEstado.brancos
                    : dadosCargo?.brancos
                )}
              </strong>
            </article>

            <article className="summary-card">
              <span>Votos nulos</span>

              <strong>
                {formatNumber(
                  isAll
                    ? dadosTodosEstado.nulos
                    : dadosCargo?.nulos
                )}
              </strong>
            </article>

            {!isAll && (
              <article className="summary-card">
                <span>Votos em candidatos</span>

                <strong>
                  {formatNumber(totalVotos)}
                </strong>
              </article>
            )}

            {isAll && (
              <article className="summary-card">
                <span>Municípios</span>

                <strong>
                  {formatNumber(cidades.length)}
                </strong>
              </article>
            )}
          </div>

          {!isAll && (
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
                  {candidatos.map((candidato, index) => {
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
                              #{index + 1}
                            </span>

                            <div>
                              <h4>{candidato.nome}</h4>

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
                  })}
                </div>
              )}
            </div>
          )}

          {isAll && (
            <div className="empty-state">
              <p>
                Selecione uma cidade para visualizar a votação
                de cada candidato.
              </p>
            </div>
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