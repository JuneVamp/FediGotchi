import { useEffect, useMemo, useState } from 'react';

type PetView = {
    petView: Pet
}

type Pet = {
  name: string;
  imageSrc?: string;
  stats?: Record<string, number>;
  environmentFV?: { name?: string; id?: string; serverURL?: string };
  activity?: {
    activity?: { name?: string; id?: string; serverURL?: string };
    partner?: { id?: string; serverURL?: string };
  };
  FV?: { id?: string; serverURL?: string };
  entityRelationships?: Record<string, number>;
  activityRelationships?: Record<string, number>;
};

type Environment = {
  name: string;
  items?: string[];
  petsFV?: Array<{ id?: string; serverURL?: string }>;
  FV?: { id?: string; serverURL?: string };
  imageSrc?: string;
};

type PetApiResponse = { allPetViews?: Pet[] };
type EnvironmentApiResponse = { allEnvironmentViews?: Environment[] };

const defaultServerUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3251';

function fetchJson<T>(path: string, serverUrl: string): Promise<T> {
  return fetch(`${serverUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
  }).then(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  });
}

function getAssetUrl(serverUrl: string, imageSrc?: string) {
  if (!imageSrc) {
    return 'https://placehold.co/220x220/?text=Pet';
  }

  if (imageSrc.startsWith('http')) {
    return imageSrc;
  }

  const normalized = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
  return `${serverUrl}${normalized}`;
}

function App() {
  const [serverUrl, setServerUrl] = useState(defaultServerUrl);
  const [pets, setPets] = useState<Pet[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeView, setActiveView] = useState<'about' | 'environments' | 'pets' | 'pet' | 'installation'>('about');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alreadyRan = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [petResponse, environmentResponse] = await Promise.all([
          fetchJson<PetApiResponse>('/api/pets', serverUrl),
          fetchJson<EnvironmentApiResponse>('/api/environments', serverUrl),
        ]);

        if (alreadyRan) return;

        setPets(petResponse.allPetViews || []);
        setEnvironments(environmentResponse.allEnvironmentViews || []);
      } 
      catch (loadError) {
        console.error(loadError);

        if (!alreadyRan) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load data from the server API.');
        }
      } 
      finally {
        if (!alreadyRan) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      alreadyRan = true;
    };
  }, [serverUrl]);

  const petsById = useMemo(() => new Map(
    pets
      .filter((pet) => pet.FV?.id)
      .map((pet) => [pet.FV?.id, pet]),
  ), [pets]);


  const renderAbout = () => (
    <section className="content-panel about-panel">
      <h2>About FediFlock</h2>
      <p>
        Hello, welcome to FediFlock, a federated virtual pet framework and implementation.
      </p>
      <p>
        Virtual pets have been lonely for very long, lets give them friends and more life. 
      </p>
      <p>
        The project aims to provide developers with a way to connect your virtual pet to other virtual pets : a federated social network for virtual pets. You can add your virtual pet's behaviours and simulation method to the pet models and systems, and run this project on a publicly hosted server, making your pets available to be contacted by other people who have done the same and have your server name.
      </p>
      <center> 
        <hr></hr>
      <p>
        This work was done as part of my Masters thesis at Telecom Paris supervised by <a href='https://conclave.cs.tsukuba.ac.jp/'>Prof. Claus Aranha</a>, which you can read <a href='https://Junevamp.github.io/assets/pdf/June_M2_Thesis_Virtual_Pets.pdf'>here</a> and access the project on github <a href='https://github.com/JuneVamp/FediGotchi'>here</a>
      </p>
      <p>
          handmade with {'<'+3} by <a href="https://JuneVamp.github.io">June Bhartia</a>.
      </p>
      </center>
    </section>
  );

  const renderPets = () => (
    <section className="content-panel">
      <h2>Pets</h2>
      <div className="pet-list">
        {pets.map((pet) => (
          <PetView
            key={pet.FV?.id || pet.name}
            petInit={pet}
          />
        ))}
      </div>
    </section>
  );

  const renderEnvironments = () => (
    <section className="content-panel">
      <h2>Environments</h2>
      <div className="environment-list">
        {environments.map((environment) => (
          <div key={environment.FV?.id || environment.name} className="environment-card">
            {environment.imageSrc && (
              <img src={getAssetUrl(serverUrl, environment.imageSrc)} alt={environment.name} />
            )}
            <h3>{environment.name}</h3>
            <p>{environment.items?.length ? environment.items.join(', ') : 'No items listed'}</p>
            <div className="environment-pets">
              <span className="environment-pets-label">Pets here</span>
              <div className="pet-picture-list">
                {environment.petsFV?.map((petReference) => {
                  const pet = petReference.id ? petsById.get(petReference.id) : undefined;

                  if (!pet) return null;

                  return (
                    <button
                      type="button"
                      className="pet-picture-button"
                      key={pet.FV?.id || pet.name}
                      onClick={() => {
                        setSelectedPet(pet);
                        setActiveView('pet');
                      }}
                      aria-label={`View ${pet.name}`}
                      title={`View ${pet.name}`}
                    >
                      <img src={getAssetUrl(pet.FV?.serverURL || serverUrl, pet.imageSrc)} alt="" />
                    </button>
                  );
                })}
                {!environment.petsFV?.some((petReference) => petReference.id && petsById.has(petReference.id)) && (
                  <span className="empty-pets">No pets listed</span>
                )}
              </div>
            </div>
            <div className="environment-meta">
              <span>{environment.petsFV?.length || 0} pets</span>
              <span>{environment.FV?.serverURL || serverUrl}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderPet = () => (
    <section className="content-panel pet-page">
      <button type="button" className="back-button" onClick={() => setActiveView('environments')}>
        Back to environments
      </button>
      <h2>{selectedPet?.name || 'Pet'}</h2>
      {selectedPet ? <PetView petInit={selectedPet} /> : <p>This pet is no longer available.</p>}
    </section>
  );

  const renderInstallationPage = () => (
    <section className="content-panel installation-panel">
      <h2>Installation</h2>
      <p>
        To install FediFlock, follow these steps:
      </p>
      <ol>
        <li>Clone the repository from <a href="https://github.com/juneVamp/FediGotchi">GitHub</a>.</li>
        <li>Install the required dependencies using npm.</li>
        <li>Configure the API server URL in the application settings.</li>
        <li>Start the development server and access the application in your browser.</li>
      </ol>
    </section>
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <h1>
            <button type="button" className="brand-link" onClick={() => setActiveView('about')}>
              Fediflock
            </button>
          </h1>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <button type="button" className={activeView === 'about' ? 'active' : ''} onClick={() => setActiveView('about')}>
            About
          </button>
          <button type="button" className={activeView === 'environments' ? 'active' : ''} onClick={() => setActiveView('environments')}>
            Environments
          </button>
          <button type="button" className={activeView === 'pets' ? 'active' : ''} onClick={() => setActiveView('pets')}>
            Pets
          </button>
          <button type="button" className={activeView === 'installation' ? 'active' : ''} onClick={() => setActiveView('installation')}>
            Installation
          </button>
        </nav>

        <div className="toolbar">
          <label className="server-control">
            <span>API server</span>
            <input
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value.trim() || defaultServerUrl)}
              aria-label="Server URL"
            />
          </label>
        </div>
      </header>

      <main className="app-main">{/* while this works i feel evil doing this*/}

        <>
          {activeView === 'about' && renderAbout()} 
          {activeView === 'installation' && renderInstallationPage()}
        </>

        {error && activeView!=='about' && activeView!=='installation' ? <div className="error-banner">{error}</div> : null}

        {!loading && !error && (
          <>
            {activeView === 'pets' && renderPets()}
            {activeView === 'environments' && renderEnvironments()}
            {activeView === 'pet' && renderPet()}
          </>
        )}

        {loading && activeView !== 'about' && activeView !== 'installation' ? <div className="loading">Loading FediFlock data...</div> : null}
      </main>
    </div>
  );
}

function PetView({ petInit }: { petInit: Pet }) {
    const serverUrl = petInit.FV?.serverURL || defaultServerUrl;
    const [pet, setPetState] = useState<Pet>(petInit);

    const petId = petInit.FV?.id;

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const updatedPet = await fetchJson<PetView>(`/api/pets/${pet.FV?.id}`, serverUrl);
                setPetState(updatedPet.petView);
            } catch (error) {
                console.error(`Failed to fetch updated data for pet ${pet.FV?.id}:`, error);
            }
        }, 1000); // Fetch every 1 second

        return () => clearInterval(interval);
    }, [petId, serverUrl]);


    return (
    <div key={pet.FV?.id || pet.name} className="pet-detail-card">
        <div className="pet-detail-header">
            <img src={getAssetUrl(serverUrl, pet.imageSrc)} alt={pet.name} />
            <div className="pet-detail-header-text">
            <h3>{pet.name}</h3>
            <p>{pet.FV?.serverURL || serverUrl}</p>
            </div>
        </div>

        <div className="pet-details">
            <div>
            <label>Current activity</label>
            <span>{pet.activity?.activity?.name || 'Idle'} {pet.activity?.partner?.id ? "with" : ""} {pet.activity?.partner?.id || ""} </span>
            </div>
            <div>
            <label>Environment</label>
            <span>{pet.environmentFV?.name || 'Unknown'}</span>
            </div>
        </div>

        <div className="table-like">
            {Object.entries(pet.stats || {}).map(([key, value]) => (
            <div key={`${pet.name}-stats-${key}`} className="metric-row">
                <span>{key}</span>
                <strong>{value}</strong>
            </div>
            ))}
        </div>
    </div>)
}

export default App;
