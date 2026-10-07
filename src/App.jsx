import { useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

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

async function readApiJson(response, route) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      `${route} não respondeu como API (HTTP ${response.status}). Para testar localmente, use "npx vercel dev"; no site publicado, confirme que as funções foram incluídas no deploy.`,
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(`${route} retornou uma resposta inválida (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(
      result.error || `Falha na API ${route} (HTTP ${response.status}).`,
    );
  }

  return result;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [data, setData] = useState({});
  const [cidade, setCidade] = useState(ALL_CITIES);
  const [cargo, setCargo] = useState('Deputado Estadual');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/session')
      .then((response) => readApiJson(response, '/api/session'))
      .then((session) => setIsAuthenticated(session.authenticated))
      .catch((err) => {
        console.error(err);
        setLoginError('Não foi possível verificar o acesso. Tente novamente.');
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetch('/api/data')
      .then((response) => {
        if (response.status === 401) {
          setLoginError('Sua sessão expirou. Entre novamente.');
          setIsAuthenticated(false);
          return null;
        }

        return readApiJson(response, '/api/data');
      })
      .then((json) => {
        if (!json) {
          return;
        }

        setData(json.data ?? json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [isAuthenticated]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      await readApiJson(response, '/api/login');
      setPassword('');
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

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

  if (!isAuthenticated) {
    if (isAuthenticated === null) {
      return (
        <main className="access-screen">
          <p aria-live="polite" className="access-loading" role="status">
            Verificando acesso...
          </p>
        </main>
      );
    }

    return (
      <main className="access-screen">
        <section
          aria-labelledby="access-title"
          aria-modal="true"
          className="access-dialog"
          role="dialog"
        >
          <h1 id="access-title">Acesso restrito</h1>
          <p>Digite a senha para entrar no site.</p>

          <form className="access-form" onSubmit={handleLogin}>
            <label htmlFor="access-password">Senha</label>
            <input
              autoComplete="current-password"
              autoFocus
              id="access-password"
              onChange={(event) => {
                setPassword(event.target.value);
                setLoginError('');
              }}
              disabled={isLoggingIn}
              required
              type="password"
              value={password}
            />
            {loginError && (
              <p aria-live="polite" className="access-error" role="alert">
                {loginError}
              </p>
            )}
            <button disabled={isLoggingIn} type="submit">
              {isLoggingIn ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </main>
    );
  }

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
      <Analytics />
    </main>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export default App;