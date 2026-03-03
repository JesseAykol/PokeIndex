// variables
const allPokemons = [];
let filteredPokemons = [];
let currentIndex = 0;
const pageSize = 20;           
let search = "";               
const selectedTypes = new Set();

// data fetch
async function getAllPokemon() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
    const data = await response.json();
    return data.results;
}

async function getPokemonDetails(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function getEveryPokemon() {
    const results = await getAllPokemon();
    allPokemons.push(...results);
    filteredPokemons = [...allPokemons];
    renderPokemon();
}

async function getAllTypes() {
    const response = await fetch('https://pokeapi.co/api/v2/type?limit=18');
    const data = await response.json();
    return data.results;
}

// pokemon rendering
async function renderPokemon() {
    const pokemonContainer = document.getElementById("pokemonContainer");
    const loading = document.getElementById("loading");
    const emptyMessage = document.getElementById("emptyMessage");

    // Show loading spinner/text
    loading.style.display = "block";
    emptyMessage.style.display = "none";

    try {
        // use filteredPokemons
        const filtered = filteredPokemons.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

        if (filtered.length === 0) {
            // no results
            pokemonContainer.innerHTML = "";
            emptyMessage.style.display = "block";
            document.getElementById("loadMoreBtn").style.display = "none";
            return;
        }

        const slice = filtered.slice(currentIndex, currentIndex + pageSize);

        
        const details = await Promise.all(slice.map(p => getPokemonDetails(p.url)));

        details.forEach(pokemonInfo => {
            pokemonContainer.innerHTML += `
                <div class="pokemonCard">
                    <img src="${pokemonInfo.sprites.front_default}" alt="${pokemonInfo.name}">
                    <p>${pokemonInfo.name}</p>
                </div>
            `;
        });

        currentIndex += pageSize;

        document.getElementById("loadMoreBtn").style.display = currentIndex >= filtered.length ? "none" : "block";

    } catch (error) {
        console.error(error);
        pokemonContainer.innerHTML = `<p>Er is iets misgegaan bij het laden van de data. Controleer je internetverbinding.</p>`;
        document.getElementById("loadMoreBtn").style.display = "none";
    } finally {
        loading.style.display = "none";
    }
}

// type rendering
async function renderCategoryButtons() {
    const types = await getAllTypes();
    const container = document.getElementById("typeContainer");
    container.innerHTML = "";

    types.forEach(type => {
        const btn = document.createElement("button");
        btn.textContent = type.name;
        btn.classList.add("typeBtn");

        // click handler
        btn.addEventListener("click", () => {
            if (selectedTypes.has(type.name)) {
                selectedTypes.delete(type.name);
                btn.style.backgroundColor = ""; // reset color
                btn.style.color = "";
            } else {
                selectedTypes.add(type.name);
                btn.style.backgroundColor = "blue"; // selected color
                btn.style.color = "white";
            }

            filterPokemonByType();
        });

        container.appendChild(btn);
    });
}

async function filterPokemonByType() {
    const pokemonContainer = document.getElementById("pokemonContainer");
    pokemonContainer.innerHTML = "";
    currentIndex = 0;

    if (selectedTypes.size === 0) {
        filteredPokemons = [...allPokemons];
        renderPokemon();  
        return;
    }

    let typeFiltered = [];

    for (const typeName of selectedTypes) {
        const typeData = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`).then(res => res.json());
        typeFiltered.push(...typeData.pokemon.map(p => p.pokemon));
    }

    const uniquePokemons = Array.from(new Map(typeFiltered.map(p => [p.name, p])).values());

    filteredPokemons.splice(0, filteredPokemons.length, ...uniquePokemons);

    renderPokemon(); // render first batch
}

function zoekbarUpdated() {
    const input = document.getElementById("pokemonSearch");
    search = input.value;
    currentIndex = 0;
    document.getElementById("pokemonContainer").innerHTML = "";
    filterPokemonByType();
}

document.getElementById("pokemonSearch").addEventListener("input", zoekbarUpdated);
document.getElementById("loadMoreBtn").addEventListener("click", renderPokemon);

getEveryPokemon();
renderCategoryButtons();