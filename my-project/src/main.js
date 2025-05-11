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
  // Create the basic structure for the urinals page
  rootElement.innerHTML = `
    <h1>Public Urinals in Brussels</h1>
    
    <div id="urinals-container">
      <div id="map"></div>
      <div id="records"></div>
    </div>
  `;
  
  // Load and display the urinals data
  loadUrinalsData();

},
};

function loadUrinalsData() {
  fetch('https://bruxellesdata.opendatasoft.com/api/explore/v2.1/catalog/datasets/urinoirs-publics-vbx/records?limit=20')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      const results = data.results;
      
      if (results && results.length > 0) {
        // Store all results
        const allResults = [...results];
        
        // Store current results
        let currentFilteredResults = [...allResults];
        
        // Load favorites from localStorage
        const favorites = loadFavorites();
        
        // Initialize the map
        const map = L.map('map').setView([50.8466, 4.3528], 12); // Brussels coordinates
        
        // Add a tile layer to the map (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Define columns for the table display
        const displayColumns = [
          { key: 'objectid', label: 'ID' },
          { key: 'address_fr', label: 'Location' },
          { key: 'type_fr', label: 'Type' },
          { key: 'pmr_fr', label: 'Wheelchair Accessible' },
          { key: 'openinghours', label: 'Opening Hours' },
          { key: 'municipality_fr', label: 'City/District' },
          { key: 'favorite', label: 'Favorite', isAction: true }
        ];
        
        // Create function to render the data
        const renderData = (items) => {
          // Store the current filtered results for later use
          currentFilteredResults = items;
          
          // Clear existing markers
          map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
              map.removeLayer(layer);
            }
          });
          
          const recordsDiv = document.getElementById('records');
          recordsDiv.innerHTML = '';
          
          // Create favorites section first
          const favoritesSection = document.createElement('div');
          favoritesSection.className = 'favorites-section';
          favoritesSection.innerHTML = '<h2>My Favorites</h2>';
          
          // Get current favorites
          const currentFavorites = loadFavorites();
          const favoriteItems = items.filter(item => 
            currentFavorites.includes(item.objectid)
          );
          
          // Add favorites table if there are any
          if (favoriteItems.length > 0) {
            const favTable = createTable(favoriteItems, displayColumns, currentFavorites);
            favoritesSection.appendChild(favTable);
          } else {
            favoritesSection.innerHTML += '<p class="no-favorites">No favorites yet. Click the heart icon to add favorites.</p>';
          }
          
          recordsDiv.appendChild(favoritesSection);
          
          // Create a table for all results
          const allResultsHeading = document.createElement('h2');
          allResultsHeading.textContent = 'All Urinals';
          recordsDiv.appendChild(allResultsHeading);
          
          // Create the table for all results
          const allResultsTable = createTable(items, displayColumns, currentFavorites);
          recordsDiv.appendChild(allResultsTable);
          
          // Add markers to the map
          addMarkersToMap(items, map, currentFavorites);
        };
        
        // Create reusable function to build tables
        function createTable(items, columns, favorites) {
          const table = document.createElement('table');
          const thead = document.createElement('thead');
          const tbody = document.createElement('tbody');
          
          // Create table header
          const headerRow = document.createElement('tr');
          columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          
          // Populate table rows
          items.forEach(result => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
              const td = document.createElement('td');
              
              if (column.isAction && column.key === 'favorite') {
                // Add heart icon for favorites
                const isFavorite = favorites.includes(result.objectid);
                
                const heartIcon = document.createElement('span');
                heartIcon.className = `favorite-icon ${isFavorite ? 'active' : ''}`;
                heartIcon.innerHTML = isFavorite ? '❤' : '♡';
                heartIcon.setAttribute('data-id', result.objectid);
                
                // Add click event to toggle favorite
                heartIcon.addEventListener('click', () => {
                  const id = result.objectid;
                  toggleFavorite(id);
                  
                  // Refresh the display using the current results
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
          
          table.appendChild(thead);
          table.appendChild(tbody);
          return table;
        }
        
        // Function to add markers to map
        function addMarkersToMap(items, map, favorites) {
          items.forEach(result => {
            // Add marker to the map if geo_point_2d exists
            if (result.geo_point_2d) {
              const lat = result.geo_point_2d.lat;
              const lon = result.geo_point_2d.lon;
              
              // Create marker
              const marker = L.marker([lat, lon]).addTo(map);
              
              // Change marker icon if it's a favorite
              if (favorites.includes(result.objectid)) {
                // Use leaflet's divIcon to create a custom marker
                const favoriteIcon = L.divIcon({
                  html: '<div style="background-color: #ff4d4d; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                  className: 'favorite-marker',
                  iconSize: [15, 15]
                });
                marker.setIcon(favoriteIcon);
              }
              
              // Create popup content
              const popupContent = `
                <strong>ID: ${result.objectid || 'Unnamed'}</strong><br>
                ${result.address_fr || 'No address'}<br>
                Type: ${result.type_fr || 'Unknown'}<br>
                Wheelchair Accessible: ${result.pmr_fr || 'N/A'}<br>
                ${favorites.includes(result.objectid) ? '<span style="color: #ff4d4d;">❤ Favorite</span>' : ''}
              `;
              
              // Add popup to marker
              marker.bindPopup(popupContent);
            }
          });
        }
        
        // Function to toggle favorite status
        function toggleFavorite(id) {
          const favorites = loadFavorites();
          const index = favorites.indexOf(id);
          
          if (index === -1) {
            // Add to favorites
            favorites.push(id);
          } else {
            // Remove from favorites
            favorites.splice(index, 1);
          }
          
          // Save updated favorites
          saveFavorites(favorites);
        }
        
        // Function to load favorites from localStorage
        function loadFavorites() {
          const favoritesJson = localStorage.getItem('urinal-favorites');
          return favoritesJson ? JSON.parse(favoritesJson) : [];
        }
        
        // Function to save favorites to localStorage
        function saveFavorites(favorites) {
          localStorage.setItem('urinal-favorites', JSON.stringify(favorites));
        }
        
        // Initial render with all data
        renderData(allResults);
        
      } else {
        document.getElementById('records').textContent = 'No records found.';
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      document.getElementById('records').textContent = 'Error fetching data.';
    });
}

// Router initialiseren
new Router(routes);