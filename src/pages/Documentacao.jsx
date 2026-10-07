import AreaSwitch from '../AreaSwitch.jsx';
import './Documentacao.css';

const SOURCES = [
  {
    title: 'TSE · Resultados 2026',
    tag: 'Dados eleitorais',
    href: 'https://dadosabertos.tse.jus.br/dataset/resultados-2026',
  },
  {
    title: 'TSE · Eleitorado por local de votação',
    tag: 'Locais de votação',
    href: 'https://dadosabertos.tse.jus.br/dataset/eleitorado-2026/resource/300626b4-2b24-4d2e-b4fc-46b569cfffe5',
  },
  {
    title: 'Prefeitura de Porto Alegre · Bairros',
    tag: 'Geografia',
    href: 'https://gis-smamus.portoalegre.rs.gov.br/server/rest/services/A02_SOLO_CRIADO/bairros/FeatureServer',
  },
];

function Documentacao() {
  return (
    <main className="documentation">
      <div className="documentation-container">
        <AreaSwitch />
        <header className="documentation-hero">
          <h1>
            Como este projeto foi feito?
          </h1>

        </header>

        <section className="documentation-section">
          <div className="documentation-label">
            <span>01</span>
            <p>De onde vêm os dados?</p>
          </div>

          <div className="documentation-content">
            <h2>Fontes oficiais</h2>

            <p>
              Os dados exibidos neste projeto não são coletados
              manualmente nem estimados. Eles são derivados de
              arquivos públicos disponibilizados pela Justiça
              Eleitoral e de dados geográficos oficiais de Porto
              Alegre.
            </p>

            <div className="source-list">
              {SOURCES.map((source) => (
                <a
                  className="source"
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  key={source.title}
                >
                  <div>
                    <span>{source.tag}</span>
                    <h3>{source.title}</h3>
                    <p>{source.description}</p>
                  </div>

                  <span className="source-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

      <section className="documentation-section">
  <div className="documentation-label">
    <span>02</span>
    <p>Como os dados foram processados?</p>
  </div>

  <div className="documentation-content">
    <h2>
      Do CSV ao JSON
    </h2>

    <p>
      Os resultados oficiais são disponibilizados em arquivos CSV
      muito grandes. O principal arquivo utilizado neste projeto
      tem cerca de <strong>1,7 GB</strong>.
    </p>

    <p>
      Em vez de abrir esse arquivo inteiro em um editor de
      planilhas ou carregar tudo na memória, foram criados pequenos
      programas de linha de comando (CLI) para ler, filtrar,
      organizar e transformar os dados.
    </p>

    <p>
      Esses programas fazem apenas o trabalho necessário. Eles
      percorrem milhões de registros, selecionam as informações
      relevantes e geram arquivos menores, prontos para serem
      utilizados pela aplicação.
    </p>

    <div className="pipeline">
      <div className="pipeline-step">
        <strong>01</strong>
        <span>Arquivo original</span>
        <small>
          CSV com milhões de registros
        </small>
      </div>

      <div className="pipeline-line" />

      <div className="pipeline-step">
        <strong>02</strong>
        <span>Script de processamento</span>
        <small>
          Pequeno programa executado pelo terminal
        </small>
      </div>

      <div className="pipeline-line" />

      <div className="pipeline-step">
        <strong>03</strong>
        <span>Filtrar e organizar</span>
        <small>
          Apenas os dados necessários são separados
        </small>
      </div>

      <div className="pipeline-line" />

      <div className="pipeline-step">
        <strong>04</strong>
        <span>JSON</span>
        <small>
          Dados menores e preparados para o site
        </small>
      </div>
    </div>


    <div className="code-block">
      <p>Exemplo de como um desses pequenos programas funciona:</p>

      <pre>{`$ python3 generate_porto_alegre.py

Lendo resultados...
Filtrando Porto Alegre...
Relacionando locais de votação...
Agrupando votos por bairro...
Gerando porto_alegre_votos.json

✓ JSON criado
✓ Dados prontos para o mapa`}</pre>
    </div>

    <div className="method-highlight">
      <strong>
        Arquivo enorme → pequenos scripts → dados organizados → site
      </strong>
    </div>
  </div>
</section>

        <section className="documentation-section">
          <div className="documentation-label">
            <span>03</span>
            <p>O que existe nos resultados?</p>
          </div>

          <div className="documentation-content">
            <h2>Votação por município</h2>

            <p>
              Para a visão estadual e municipal, os registros são
              agrupados por cidade e cargo. Os votos nominais são
              agrupados pelo candidato e partido correspondente.
            </p>

            <div className="data-table">
              <div className="data-row data-header">
                <span>Campo</span>
                <span>O que significa</span>
              </div>

              <div className="data-row">
                <strong>NM_MUNICIPIO</strong>
                <span>Município onde o voto foi apurado</span>
              </div>

              <div className="data-row">
                <strong>NR_LOCAL_VOTACAO</strong>
                <span>
                  Identificador do local físico de votação
                </span>
              </div>

              <div className="data-row">
                <strong>NR_ZONA</strong>
                <span>Zona eleitoral</span>
              </div>

              <div className="data-row">
                <strong>NR_SECAO</strong>
                <span>Seção eleitoral</span>
              </div>

              <div className="data-row">
                <strong>NR_VOTAVEL</strong>
                <span>Identificador do voto/candidato</span>
              </div>

              <div className="data-row">
                <strong>QT_VOTOS</strong>
                <span>Quantidade de votos registrados</span>
              </div>
            </div>
          </div>
        </section>

        <section className="documentation-section">
          <div className="documentation-label">
            <span>04</span>
            <p>Como funciona o mapa?</p>
          </div>

          <div className="documentation-content">
            <h2>Porto Alegre por bairro</h2>

            <p>
              Para o mapa de Porto Alegre, os resultados são
              primeiro filtrados para o município e relacionados
              ao cadastro dos locais de votação. A partir desse
              relacionamento, o local de votação recebe o bairro
              correspondente ao endereço cadastrado.
            </p>

            <div className="method-highlight">
              <strong>
                local de votação → bairro → votos
              </strong>
            </div>

            <p>
              Os limites utilizados para desenhar os bairros vêm
              da base geográfica oficial da Prefeitura de Porto
              Alegre.
            </p>
          </div>
        </section>

        <section className="documentation-section">
          <div className="documentation-label">
            <span>05</span>
            <p>Uma distinção importante</p>
          </div>

          <div className="documentation-content">
            <h2>Bairro não é domicílio eleitoral</h2>

            <p>
              O mapa não mostra onde os eleitores moram.
            </p>

            <p>
              Ele mostra os votos registrados nos <strong>
                locais de votação localizados naquele bairro
              </strong>
              . Um local de votação pode atender eleitoras e
              eleitores de diferentes áreas.
            </p>

            <div className="warning-box">
              <span>Nota metodológica</span>

              <p>
                Por isso, expressões como “votos do bairro”
                devem ser entendidas como “votos apurados nos
                locais de votação daquele bairro”.
              </p>
            </div>
          </div>
        </section>

        <section className="documentation-section">
          <div className="documentation-label">
            <span>06</span>
            <p>Por que DuckDB?</p>
          </div>

          <div className="documentation-content">
            <h2>Processamento de arquivos grandes</h2>

            <p>
              Os arquivos oficiais de resultados podem ter milhões
              de registros. Em vez de abrir todo o arquivo em
              memória, o projeto usa consultas analíticas para
              filtrar, agrupar e somar apenas os dados necessários.
            </p>

            <p>
              O próprio TSE recomenda o uso de ferramentas
              adequadas para trabalhar com arquivos grandes de
              resultados eleitorais.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Documentacao;