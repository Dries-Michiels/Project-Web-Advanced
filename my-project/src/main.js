import './style.css';
import javascriptLogo from './javascript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.js';
import Router from './router.js';

// Routes definiëren
const routes = {
  '/': (rootElement) => {
    rootElement.innerHTML = '<h1>Home</h1>';
  },
  '/about': (rootElement) => {
    rootElement.innerHTML = '<h1>About</h1>';
  },
  '/contact': (rootElement) => {
    rootElement.innerHTML = '<h1>Contact</h1>';
  },
  '/404': (rootElement) => {
    rootElement.innerHTML = '<h1>404 Not Found</h1>';
  },
'/urinals': (rootElement) => {
  rootElement.innerHTML = `
    <h1>Openbare urinoirs in Brussel</h1>
    
    <div id="filters-container">
      <h3>Filter Opties</h3>
      <div class="filter-controls">
        <div class="filter-group">
          <label for="price-filter">Prijs:</label>
          <select id="price-filter">
            <option value="">Alle</option>
            <option value="Gratis">Gratis</option>
            <option value="Betalend">Betaald</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="hours-filter">Openingstijden:</label>
          <select id="hours-filter">
            <option value="">Alle</option>
            <option value="24/24">24/7 Open</option>
            <option value="limited">Beperkte uren</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="wheelchair-filter">Rolstoeltoegankelijk:</label>
          <select id="wheelchair-filter">
            <option value="">Alle</option>
            <option value="PBM">Toegankelijk</option>
            <option value="Niet PBM">Niet Toegankelijk</option>
          </select>
        </div>
        
        <button id="reset-filters">Reset Filters</button>
      </div>
    </div>
    
    <div id="urinals-container">
      <div id="map"></div>
      <div id="records"></div>
    </div>
  `;
  
  
  loadUrinalsData(); //Laat de functie in de urinals pagina
},
};

function loadUrinalsData() { 
  fetch('https://opendata.brussels.be/api/explore/v2.1/catalog/datasets/toilettes_publiques_vbx/records?limit=20')
    .then(response => { //Api ophalen
      if (!response.ok) {
        throw new Error('Er is een fout ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      const results = data.results;
      
      if (results && results.length > 0) {
        //Alle resultaten opslaan voor later gebruik
        const allResults = [...results];
        
        //Huidige gefilterde resultaten opslaan
        let currentFilteredResults = [...allResults];
        
        //Favorieten laden uit localStorage
        const favorites = loadFavorites();
        
//Kaart instellen met Leaflet (met behulp van AI en Leaflet website)
const map = L.map('map').setView([50.8466, 4.3528], 12); //Coördinaten van Brussel

//Kaartlaag toevoegen (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//Event listeners instellen voor de filters
setupFilterListeners();

// Functie om alle filter event listeners in te stellen
function setupFilterListeners() {
  const priceFilter = document.getElementById('price-filter');
  const hoursFilter = document.getElementById('hours-filter');
  const wheelchairFilter = document.getElementById('wheelchair-filter');
  const resetButton = document.getElementById('reset-filters');
  
  if (!priceFilter || !hoursFilter || !wheelchairFilter || !resetButton) return; //Veiligheidscontrole om te zorgen dat alle elementen bestaan. Niet persee nodig maar wel handig
  
//Functie om filters toe te passen op de data
function applyFilters() {
  let filtered = [...allResults];
  
  //Prijsfilter
  if (priceFilter.value) {
    filtered = filtered.filter(item => 
      item.pricing_nl && item.pricing_nl.includes(priceFilter.value)
    );
  }
  
  //Openingstijdenfilter
  if (hoursFilter.value) {
    if (hoursFilter.value === '24/24') {
      filtered = filtered.filter(item => 
        item.openinghours && item.openinghours.includes('24/24')
      );
    } else if (hoursFilter.value === 'limited') {
      filtered = filtered.filter(item => 
        item.openinghours && !item.openinghours.includes('24/24')
      );
    }
  }
  
  //Rolstoeltoegankelijkheidsfilter
  if (wheelchairFilter.value) {
    filtered = filtered.filter(item => 
      item.pmr_nl === wheelchairFilter.value
    );
  }
  
  //Gefilterde resultaten weergeven
  renderData(filtered);
}
  
  //Event listeners toevoegen aan alle filterbesturingselementen
  priceFilter.addEventListener('change', applyFilters);
  hoursFilter.addEventListener('change', applyFilters);
  wheelchairFilter.addEventListener('change', applyFilters);
  
  //Resetknop instellen om alle filters te wissen
  resetButton.addEventListener('click', () => {
    priceFilter.value = '';
    hoursFilter.value = '';
    wheelchairFilter.value = '';
    
    //Toon alle resultaten opnieuw
    renderData(allResults);
  });
}
        
        //Kolom voor de tabelweergave
        const displayColumns = [
          { key: 'objectid', label: 'ID' },
          { key: 'address_nl', label: 'Locatie' },
          { key: 'pricing_nl', label: 'Prijs' },
          { key: 'pmr_nl', label: 'Rolstoeltoegankelijk' },
          { key: 'openinghours', label: 'Openingstijden' },
          { key: 'municipality_nl', label: 'Stad' },
          { key: 'favorite', label: 'Favoriet', isAction: true }
        ];
        
        //Functie om de data weer te geven in tabellen en op de kaart
        const renderData = (items) => {
          //Huidige gefilterde resultaten opslaan voor later gebruik
          currentFilteredResults = items;
          
          //Bestaande markers van de kaart verwijderen
          map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
              map.removeLayer(layer);
            }
          });
          
          //DOM-element voor de records vinden en leegmaken
          const recordsDiv = document.getElementById('records');
          recordsDiv.innerHTML = '';
          
          //Sectie voor favorieten aanmaken
          const favoritesSection = document.createElement('div');
          favoritesSection.className = 'favorites-section';
          favoritesSection.innerHTML = '<h2>Favorieten</h2>';
          
          //Huidige favorieten ophalen
          const currentFavorites = loadFavorites();
          const favoriteItems = items.filter(item => 
            currentFavorites.includes(item.objectid)
          );
          
          //Favorieten toevoegen als er favorieten zijn
          if (favoriteItems.length > 0) {
            const favTable = createTable(favoriteItems, displayColumns, currentFavorites);
            favoritesSection.appendChild(favTable);
          } else {
            favoritesSection.innerHTML += '<p class="no-favorites">Nog geen favorieten. Klik op het hartje om favorieten toe te voegen.</p>';
          }
          
          //Favorietensectie toevoegen aan de DOM
          recordsDiv.appendChild(favoritesSection);
          
          //Titel voor alle resultaten aanmaken
          const allResultsHeading = document.createElement('h2');
          allResultsHeading.textContent = 'All Urinals';
          recordsDiv.appendChild(allResultsHeading);
          
          //Tabel voor alle resultaten aanmaken en toevoegen
          const allResultsTable = createTable(items, displayColumns, currentFavorites);
          recordsDiv.appendChild(allResultsTable);
          
          //Markers toevoegen aan de kaart
          addMarkersToMap(items, map, currentFavorites);
        };
        
        //Herbruikbare functies om tabellen mee te maken
        function createTable(items, columns, favorites) {
          const table = document.createElement('table');
          const thead = document.createElement('thead');
          const tbody = document.createElement('tbody');
          
          //Tabelkop aanmaken
          const headerRow = document.createElement('tr');
          columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          
          //Tabelrijen vullen met data
          items.forEach(result => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
              const td = document.createElement('td');
              
              if (column.isAction && column.key === 'favorite') { //Hart toevoegen aan favorieten
                
                const isFavorite = favorites.includes(result.objectid);
                
                const heartIcon = document.createElement('span');
                heartIcon.className = `favorite-icon ${isFavorite ? 'active' : ''}`;
                heartIcon.innerHTML = isFavorite ? '❤' : '♡';
                heartIcon.setAttribute('data-id', result.objectid);
                
                //Klikevent voor favorieten
                heartIcon.addEventListener('click', () => {
                  const id = result.objectid;
                  toggleFavorite(id);
                  
                  //Herladen om de nieuwe favorieten te zien
                  renderData(currentFilteredResults);
                });
                
                td.appendChild(heartIcon);
              } else {
                td.textContent = result[column.key] || 'Geen info';
              }
              
              row.appendChild(td);
            });
            
            tbody.appendChild(row);
          });

          //Tabel samenstellen en teruggeven
          table.appendChild(thead);
          table.appendChild(tbody);
          return table;
        }
        
        //Functie om markers (punten) aan de kaart toe te voegen (met behulp van AI en Leaflet website)
        function addMarkersToMap(items, map, favorites) {
          items.forEach(result => {
            //Alleen marker toevoegen als geo_point_2d bestaat
            if (result.geo_point_2d) {
              const lat = result.geo_point_2d.lat;
              const lon = result.geo_point_2d.lon;
              
              //Marker aanmaken en toevoegen aan de kaart
              const marker = L.marker([lat, lon]).addTo(map);
              
              //Markericoon aanpassen als het een favoriet is
              if (favorites.includes(result.objectid)) {
                //Leaflet's divIcon gebruiken om een aangepaste marker te maken
                const favoriteIcon = L.divIcon({
                  html: '<div style="background-color: #ff4d4d; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                  className: 'favorite-marker',
                  iconSize: [15, 15]
                });
                marker.setIcon(favoriteIcon);
              }
              
              //Popup maken met de informatie over het urinoir op basis van de gegevens en locatie
              const popupContent = `
                <strong>ID: ${result.objectid || 'Unnamed'}</strong><br>
                ${result.address_nl || 'Geen adres'}<br>
                Type: ${result.type_nl || 'Onbekend'}<br>
                Rolstoeltoegankelijk: ${result.pmr_nl || 'N/A'}<br>
                ${favorites.includes(result.objectid) ? '<span style="color: #ff4d4d;">❤ Favoriet</span>' : ''}
              `;
              
              //Popup toevoegen aan de marker
              marker.bindPopup(popupContent);
            }
          });
        }
        
        //Functie om favorieten-status te wisselen
        function toggleFavorite(id) {
          const favorites = loadFavorites();
          const index = favorites.indexOf(id);
          
          if (index === -1) {
            //Toevoegen aan favorieten
            favorites.push(id);
          } else {
            //Verwijderen uit favorieten
            favorites.splice(index, 1);
          }
          
          //Bijgewerkte favorieten opslaan
          saveFavorites(favorites);
        }
        
        //Functie om favorieten te laden uit localStorage
        function loadFavorites() {
          const favoritesJson = localStorage.getItem('urinal-favorites');
          return favoritesJson ? JSON.parse(favoritesJson) : [];
        }
        
        //Functie om favorieten op te slaan in localStorage
        function saveFavorites(favorites) {
          localStorage.setItem('urinal-favorites', JSON.stringify(favorites));
        }

        
        
        
        //Initiële weergave met alle data
        renderData(allResults);
        
      } else { //Bericht tonen als er geen resultaten zijn
        document.getElementById('records').textContent = 'Geen records gevonden';
      }
    })
    .catch(error => { //Foutafhandeling bij het ophalen van de data
      console.error('Fout bij het ophalen van gegevens:', error);
      document.getElementById('records').textContent = 'Fout bij het ophalen van gegevens';
    });
}

//Router initialiseren
new Router(routes);